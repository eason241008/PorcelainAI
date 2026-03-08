import io
import base64
from PIL import Image
from flask import Flask, request, jsonify
from model import CORS

from model import Config, DiffusionWorker, InteractiveTuner

# ================= 辅助函数 =================
def base64_to_pil(base64_str):
    if not base64_str: return None
    if "," in base64_str: 
        base64_str = base64_str.split(",")[1]
    return Image.open(io.BytesIO(base64.b64decode(base64_str))).convert("RGB")

def pil_to_base64(image):
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

# ================= 初始化应用 =================
app = Flask(__name__)
CORS(app) 

# 全局初始化模型和算法
config = Config()
worker = DiffusionWorker(config)
tuner = InteractiveTuner(prior_config_path=config.PRIOR_CONFIG_PATH)

# 使用 app_context 确保模型加载在 Flask 上下文中 (虽然这里不是严格必须，但是好习惯)
with app.app_context():
    worker.load_model()

# ================= API 路由 =================

@app.route('/process', methods=['POST'])
def process_request():
    """传统单图生成接口"""
    try:
        data = request.json
        c_img = base64_to_pil(data.get('contentImage'))
        s_img = base64_to_pil(data.get('styleImage'))
        
        if not c_img or not s_img:
            return jsonify({'error': 'Images missing'}), 400

        custom_params = data.get('params', None) 
        res_pil = worker.process_image(c_img, s_img, params=custom_params)
        
        return jsonify({'resultImage': pil_to_base64(res_pil)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/interactive/generate', methods=['POST'])
def interactive_generate():
    """交互式批量生成接口"""
    try:
        data = request.json
        c_img = base64_to_pil(data.get('contentImage'))
        s_img = base64_to_pil(data.get('styleImage'))
        
        if not c_img or not s_img:
            return jsonify({'error': 'Images missing'}), 400
        
        # 1. 处理反馈
        action = data.get('action', None) # 'select', 'reject'
        if action:
            chosen_params = data.get('chosen_params', None)
            tuner.update_feedback(action, chosen_params)
        
        # 2. 获取参数候选
        batch_size = data.get('batch_size', 2)
        candidates = tuner.get_batch_candidates(batch_size)
        
        results = []
        
        # 3. 批量推理
        for params in candidates:
            res_pil = worker.process_image(c_img, s_img, params=params)
            results.append({
                "image": pil_to_base64(res_pil),
                "params": params,
                "debug_info": f"Str:{params['strength']:.2f}, Style:{params['ip_adapter_scale']:.2f}"
            })
            
        return jsonify({
            "results": results,
            "tuner_state": tuner.get_state()
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/interactive/reset', methods=['POST'])
def interactive_reset():
    """重置调参状态"""
    tuner.reset()
    return jsonify({"message": "Reset done", "state": tuner.get_state()})

# ================= 启动 =================
if __name__ == "__main__":
    # 端口 8000，开启多线程
    app.run(host='0.0.0.0', port=8000, threaded=True)