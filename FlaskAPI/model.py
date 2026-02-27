# model_core.py
import os
import torch
import numpy as np
import json
import threading
import random
import tempfile
from PIL import Image
from diffusers import StableDiffusionControlNetImg2ImgPipeline, ControlNetModel, UniPCMultistepScheduler, AutoencoderKL
from controlnet_aux import PidiNetDetector
from transformers import AutoModelForCausalLM, AutoTokenizer

# ================= 1. 配置参数 =================
class Config:
    # 硬件设置
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

    SD_BASE_MODEL = "../../pipline/models/Realistic_Vision_V5.1_noVAE"
    CONTROLNET_MODEL = "../../pipline/models/camenduru/control_v11p_sd15_softedge"
    VAE_MODEL = "../../pipline/models/sd-vae-ft-mse"
    IP_ADAPTER_REPO = "../../pipline/models/IP-Adapter"
    ANNOTATOR_PATH = "../../pipline/models/annotators"
    
    # VLM 模型路径 (假设为 Qwen-VL 或类似)
    VLM_MODEL_PATH = "../../pipline/models/Qwen/Qwen2.5-VL-7B-Instruct"

    # 离线调优结果路径
    PRIOR_CONFIG_PATH = "./experiments_autotune/best_params_prior.json"

    # 默认提示词 (风格交给 IP-Adapter)
    DEFAULT_PROMPT = (
        "ancient ceramic vessel, museum artifact, "
        "high quality, photorealistic, 8k, "
        "highly detailed texture, studio lighting, "
        "neutral background"
    )
    
    NEGATIVE_PROMPT = (
        "low quality, blurry, watermark, text, deformed, "
        "bad anatomy, ugly, pixelated, low resolution, "
        "smooth, glazed, porcelain, shiny" 
    )

    # 基础生成参数
    SD_STEPS = 30
    SD_GUIDANCE_SCALE = 5.0
    SEED = 42

# ================= 2. 交互式调参核心类 =================
class InteractiveTuner:
    def __init__(self, prior_config_path=None):
        self.bounds = {
            "strength": (0.55, 1.0),
            "controlnet_scale": (0.3, 1.3),
            "ip_adapter_scale": (0.5, 1.6)
        }
        
        # 加载先验知识
        if prior_config_path and os.path.exists(prior_config_path):
            print(f">>> [Tuner] Loading Prior Knowledge from {prior_config_path}...")
            try:
                with open(prior_config_path, 'r') as f:
                    loaded_params = json.load(f)
                    if all(k in loaded_params for k in self.bounds.keys()):
                        self.start_center = loaded_params
                    else:
                        raise ValueError("Keys mismatch")
                self.current_sigma = 0.1 
            except Exception as e:
                print(f">>> [Tuner] Error: {e}. Using defaults.")
                self.start_center = self._get_defaults()
                self.current_sigma = 0.25
        else:
            print(">>> [Tuner] No prior found, utilizing heuristic initialization.")
            self.start_center = self._get_defaults()
            self.current_sigma = 0.25 
            
        self.current_center = self.start_center.copy()
        self.min_sigma = 0.05
        self.decay_rate = 0.85 

    def _get_defaults(self):
        return {"strength": 0.8, "controlnet_scale": 0.8, "ip_adapter_scale": 1.0}

    def _clip(self, val, key):
        low, high = self.bounds[key]
        return max(low, min(high, val))

    def reset(self):
        print(">>> [Tuner] Resetting state.")
        self.current_center = self.start_center.copy()
        self.current_sigma = 0.1 if self.start_center != self._get_defaults() else 0.25

    def get_batch_candidates(self, batch_size=2):
        candidates = []
        for _ in range(batch_size):
            params = {}
            for key, center_val in self.current_center.items():
                noise = np.random.normal(0, 1)
                new_val = center_val + noise * self.current_sigma
                params[key] = round(self._clip(new_val, key), 3)
            candidates.append(params)
        return candidates

    def update_feedback(self, action, chosen_params=None):
        if action == 'select' and chosen_params:
            print(f">>> [Tuner] User selected. Converging...")
            self.current_center = chosen_params
            self.current_sigma = max(self.min_sigma, self.current_sigma * self.decay_rate)
        elif action == 'reject':
            print(f">>> [Tuner] User rejected. Exploring...")
            self.current_sigma = min(0.3, self.current_sigma * 1.1)

    def get_state(self):
        return {"center": self.current_center, "sigma": self.current_sigma}

# ================= 3. 模型工作流类 =================
class DiffusionWorker:
    def __init__(self, config):
        self.cfg = config
        self.pipe = None
        self.preprocessor = None
        self.lock = threading.Lock() 

    def load_model(self):
        print(">>> [System] 正在加载模型到显存...")
        self.preprocessor = PidiNetDetector.from_pretrained(self.cfg.ANNOTATOR_PATH)
        controlnet = ControlNetModel.from_pretrained(self.cfg.CONTROLNET_MODEL, torch_dtype=self.cfg.DTYPE)
        try:
            vae = AutoencoderKL.from_pretrained(self.cfg.VAE_MODEL, torch_dtype=self.cfg.DTYPE).to(self.cfg.DEVICE)
        except: vae = None

        self.pipe = StableDiffusionControlNetImg2ImgPipeline.from_pretrained(
            self.cfg.SD_BASE_MODEL, controlnet=controlnet, vae=vae, 
            torch_dtype=self.cfg.DTYPE, safety_checker=None
        ).to(self.cfg.DEVICE)
        self.pipe.scheduler = UniPCMultistepScheduler.from_config(self.pipe.scheduler.config)
        self.pipe.load_ip_adapter(self.cfg.IP_ADAPTER_REPO, subfolder="models", weight_name="ip-adapter_sd15.bin")
        try: self.pipe.enable_xformers_memory_efficient_attention()
        except: pass
        print(">>> [System] 模型加载完成。")

    def process_image(self, init_pil, style_pil, params=None, prompt_override=None):
        with self.lock:
            w, h = init_pil.size
            new_w, new_h = w - (w % 8), h - (h % 8)
            if new_w != w or new_h != h:
                init_pil = init_pil.resize((new_w, new_h), Image.LANCZOS)
            
            control_image = self.preprocessor(init_pil, detect_resolution=1024, safe=False, scribble=False)
            if control_image.size != init_pil.size:
                control_image = control_image.resize(init_pil.size, Image.LANCZOS)

            strength = params.get('strength', 0.6) if params else 0.6
            cn_scale = params.get('controlnet_scale', 0.9) if params else 0.9
            ip_scale = params.get('ip_adapter_scale', 1.0) if params else 1.0
            
            self.pipe.set_ip_adapter_scale(ip_scale)

            final_prompt = prompt_override if prompt_override else self.cfg.DEFAULT_PROMPT
            generator = torch.Generator(device=self.cfg.DEVICE).manual_seed(self.cfg.SEED)
            
            result = self.pipe(
                prompt=final_prompt,
                negative_prompt=self.cfg.NEGATIVE_PROMPT,
                image=init_pil,             
                control_image=control_image,
                ip_adapter_image=style_pil, 
                num_inference_steps=self.cfg.SD_STEPS,
                guidance_scale=self.cfg.SD_GUIDANCE_SCALE,
                strength=strength,
                controlnet_conditioning_scale=cn_scale,
                generator=generator
            ).images[0]

            return result
# ================= 4. 多模态解说生成类 =================
class VLMWorker:
    def __init__(self, config):
        self.cfg = config
        self.model = None
        self.tokenizer = None
        self.lock = threading.Lock()

    def load_model(self):
        if not os.path.exists(self.cfg.VLM_MODEL_PATH):
            print(f">>> [VLM] Model path not found: {self.cfg.VLM_MODEL_PATH}. VLM disabled (Using Mock).")
            return

        print(">>> [System] 正在加载 VLM 模型...")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.cfg.VLM_MODEL_PATH, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.cfg.VLM_MODEL_PATH, 
                device_map="auto", 
                trust_remote_code=True, 
                torch_dtype=self.cfg.DTYPE
            ).eval()
            print(">>> [System] VLM 模型加载完成。")
        except Exception as e:
            print(f">>> [VLM] Failed to load model: {e}")

    def analyze_artifact(self, image_pil, style_desc, content_desc):
        # 如果模型未加载，返回 Mock 数据
        if self.model is None:
            return {
                "title": "青花缠枝莲纹如意尊 (模拟)",
                "description": "此件作品融合了" + (style_desc or "传统纹饰") + "与" + (content_desc or "经典器型") + "。釉色莹润，青花发色沉稳。纹饰布局严谨，线条流畅有力，既保留了古代陶瓷的韵味，又在器型上展现了新的审美意趣。作为一件数字化重构的艺术品，它完美诠释了“古韵新声”的设计理念。",
                "tags": ["青花", "数字修复", "馆藏级"]
            }

        with self.lock:
            try:
                # 保存临时文件供 VLM 读取
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    image_pil.save(tmp.name)
                    tmp_path = tmp.name

                prompt = f"""
                你是一位专业的博物馆策展人。请根据这张生成的陶瓷图片，结合以下信息为它撰写一份博物馆解说词。
                
                [背景信息]
                纹饰来源: {style_desc}
                器型载体: {content_desc}
                
                [任务要求]
                1. 为它起一个富有文化底蕴的中文名称（JSON字段: title）。
                2. 撰写一段约100字的解说词，从器型、纹饰、工艺特点进行赏析，并体现“古今融合”的理念（JSON字段: description）。
                3. 提取3个关键标签（JSON字段: tags）。
                
                请直接返回合法的 JSON 格式，包含 title, description, tags 字段。不要包含其他废话。
                """

                # 构造 Qwen-VL 格式的输入 (假设 Qwen-VL/Chat 格式)
                query = self.tokenizer.from_list_format([
                    {'image': tmp_path},
                    {'text': prompt},
                ])
                
                response, _ = self.model.chat(self.tokenizer, query=query, history=None)
                
                # 清理临时文件
                os.remove(tmp_path)

                # 解析 JSON (简单的清理)
                json_str = response.replace("```json", "").replace("```", "").strip()
                try:
                    return json.loads(json_str)
                except:
                    # Fallback if JSON parsing fails
                    return {
                        "title": "AI 鉴赏",
                        "description": response,
                        "tags": ["AI生成的解析"]
                    }

            except Exception as e:
                print(f">>> [VLM] Analysis failed: {e}")
                return {
                    "title": "生成分析失败",
                    "description": "抱歉，AI 策展人暂时无法连接。请稍后再试。",
                    "tags": ["错误"]
                }
