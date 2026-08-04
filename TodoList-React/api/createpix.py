import stripe
from flask import Flask, request, jsonify

app = Flask(__name__)
stripe.api_key = "STRIPE_SECRET_KEY"

@app.route('/api/criar-pix', methods=['POST'])
def criar_pix():
    try:
        # Cria um PaymentIntent especificando o Pix como método de pagamento
        intent = stripe.PaymentIntent.create(
            amount=1000, # Valor em centavos (ex: R$ 10,00)
            currency='brl',
            payment_method_types=['pix'],
        )
        
        # O Stripe retorna os dados do Pix dentro de 'next_action'
        pix_data = intent.get('next_action', {}).get('pix_display_qr_code', {})
        
        # Dados essenciais para enviar ao aplicativo Flet
        qr_code_url = pix_data.get('image_url_png') # Link da imagem do QR Code
        copia_cola = pix_data.get('data')           # Código Pix Copia e Cola
        payment_intent_id = intent.get('id')        # ID para rastrear o status

        return jsonify({
            "success": True,
            "qr_code_url": qr_code_url,
            "copia_cola": copia_cola,
            "payment_intent_id": payment_intent_id
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
