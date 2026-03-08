# model_core.py
import os
import torch
import numpy as np
import json
import threading
import random
from PIL import Image
from diffusers import StableDiffusionControlNetImg2ImgPipeline, ControlNetModel, UniPCMultistepScheduler, AutoencoderKL
from controlnet_aux import PidiNetDetector

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