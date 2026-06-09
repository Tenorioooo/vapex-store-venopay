import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, FileText, Shield, Lock, Check, Truck } from 'lucide-react';
import { useCart } from '../components/layout/CartContext';

import ProductImage from '../components/ui/ProductImage';
import { pixelInitiateCheckout, pixelPurchase } from '../lib/metaPixel';

type PaymentMethod = 'pix' | 'card' | 'boleto';
type Step = 'info' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const { items, total, subtotal, clearCart } = useCart();

  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('info');
  const [paymentMethod] = useState<PaymentMethod>('pix');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{ pix_code: string; pix_qr_code: string; transaction_id?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos em segundos

  // Countdown Timer
  useEffect(() => {
    if (step !== 'confirm' || timeLeft <= 0 || paymentApproved) return;
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, timeLeft, paymentApproved]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Real-time polling para checar status do pagamento via Veno Payments API diretamente
  useEffect(() => {
    if (step !== 'confirm' || paymentApproved || !pixData?.transaction_id || !orderId) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-payment?transactionId=${pixData.transaction_id}&orderId=${orderId}&amount=${finalTotal - pixDiscount}&phone=${encodeURIComponent(form.phone)}&email=${encodeURIComponent(form.email)}&name=${encodeURIComponent(form.name)}&cpf=${encodeURIComponent(form.cpf)}`);
        if (res.ok) {
          const checkData = await res.json();
          if (checkData.approved) {
            setPaymentApproved(true);
          }
        }
      } catch (e) {
        console.error("Erro ao verificar status do pagamento:", e);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [step, orderId, paymentApproved, pixData]);

  const handleCheckPayment = async () => {
    if (!pixData?.transaction_id || !orderId) return;
    setCheckingPayment(true);
    try {
      const res = await fetch(`/api/check-payment?transactionId=${pixData.transaction_id}&orderId=${orderId}&amount=${finalTotal - pixDiscount}&phone=${encodeURIComponent(form.phone)}&email=${encodeURIComponent(form.email)}&name=${encodeURIComponent(form.name)}&cpf=${encodeURIComponent(form.cpf)}`);
      if (res.ok) {
        const checkData = await res.json();
        if (checkData.approved) {
          setPaymentApproved(true);
        } else {
          alert("Seu pagamento ainda não foi detectado pela Veno. Certifique-se de concluir a transferência no app do seu banco e clique para verificar novamente!");
        }
      } else {
        alert("Erro ao consultar status do Pix na Veno. Tente novamente em alguns segundos.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao consultar status. Verifique sua internet.");
    } finally {
      setCheckingPayment(false);
    }
  };

  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf: '',
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
    cardNumber: '', cardName: '', cardExpiry: '', cardCvv: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
  };

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (form.name.trim().split(' ').length < 2) {
      newErrors.name = 'Informe seu nome completo';
    }

    if (!validateEmail(form.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!validatePhone(form.phone)) {
      newErrors.phone = 'Telefone inválido (com DDD)';
    }

    if (!validateCPF(form.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!form.cep || form.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP inválido';
    }

    if (!form.street) newErrors.street = 'Rua é obrigatória';
    if (!form.number) newErrors.number = 'Número é obrigatório';
    if (!form.neighborhood) newErrors.neighborhood = 'Bairro é obrigatório';
    if (!form.city) newErrors.city = 'Cidade é obrigatória';
    if (!form.state) newErrors.state = 'UF é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isCepValid = form.cep.replace(/\D/g, '').length === 8;
  const shipping: number = isCepValid ? (total >= 300 ? 0 : 19.90) : 0;
  const promoDiscount = subtotal - total;
  
  // Master Key para testes do dono
  const isMasterAdmin = form.email.toLowerCase().trim() === 'nicolas.tensi@gmail.com' || form.cpf.replace(/\D/g, '') === '03915567116';
  const finalTotal = isMasterAdmin ? 1.00 : total + shipping;
  const pixDiscount = isMasterAdmin ? 0 : total * 0.05;

  // 🔵 Meta Pixel: Dispara o evento de Purchase quando o pagamento é confirmado
  useEffect(() => {
    if (paymentApproved && orderId) {
      pixelPurchase(finalTotal - pixDiscount, 'BRL', orderId);
    }
  }, [paymentApproved, orderId, finalTotal, pixDiscount]);

  // Track Initiate Checkout
  useEffect(() => {
    // Meta Pixel
    pixelInitiateCheckout(finalTotal);
    // Utmify
    if (typeof window !== 'undefined') {
      const utmify = (window as unknown as { utmify?: { sendEvent: (event: string) => void } }).utmify;
      if (utmify) {
        try {
          utmify.sendEvent('InitiateCheckout');
        } catch (e) {
          console.error('Erro ao disparar InitiateCheckout:', e);
        }
      }
    }
  }, [finalTotal]);

  const updateForm = (field: string, value: string) => {
    let formattedValue = value;

    // Basic masking
    if (field === 'cpf') {
      const clean = value.replace(/\D/g, '').slice(0, 11);
      formattedValue = clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else if (field === 'phone') {
      const clean = value.replace(/\D/g, '').slice(0, 11);
      if (clean.length <= 10) {
        formattedValue = clean
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        formattedValue = clean
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
    } else if (field === 'cep') {
      const clean = value.replace(/\D/g, '').slice(0, 8);
      formattedValue = clean.replace(/(\d{5})(\d)/, '$1-$2');
      
      if (clean.length === 8) {
        fetch(`https://viacep.com.br/ws/${clean}/json/`)
          .then(res => res.json())
          .then(data => {
            if (!data.erro) {
              setForm(prev => ({
                ...prev,
                street: data.logradouro || prev.street,
                neighborhood: data.bairro || prev.neighborhood,
                city: data.localidade || prev.city,
                state: data.uf || prev.state,
              }));
              setErrors(prev => {
                const next = { ...prev };
                if (data.logradouro) delete next.street;
                if (data.bairro) delete next.neighborhood;
                if (data.localidade) delete next.city;
                if (data.uf) delete next.state;
                return next;
              });
            }
          })
          .catch(e => console.error("Erro no ViaCEP:", e));
      }
    }

    setForm(prev => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleNextStep = () => {
    if (validateForm()) {
      setStep('payment');
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    // Final validation check
    if (!validateForm()) {
      setStep('info');
      return;
    }

    setSubmitting(true);
    try {
      const order = { id: `GUEST-${Date.now()}` };
      setOrderId(order.id);

        if (paymentMethod === 'pix') {
          try {
            const productNames = items.map(i => i.product?.name).join(", ") || "Pedido Vapex";
            const pixResponse = await fetch('/api/pix', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: form.name,
                cpf: form.cpf.replace(/\D/g, ''),
                email: form.email,
                phone: form.phone.replace(/\D/g, ''),
                amount: finalTotal - pixDiscount,
                productName: productNames.substring(0, 255),
                referenceId: order.id,
                trackingParameters: JSON.parse(sessionStorage.getItem('vapex_utms') || '{}')
              }),
            }).catch(() => null);

            if (pixResponse && pixResponse.ok) {
              const pixResult = await pixResponse.json();
              if (pixResult.status === 'success' && pixResult.pix_code) {
                setPixData({
                  pix_code: pixResult.pix_code,
                  pix_qr_code: pixResult.pix_qr_code || '',
                  transaction_id: pixResult.transaction_id
                });
              } else {
                alert("Erro ao gerar PIX real: " + (pixResult.error || "Verifique as chaves no .env"));
              }
            } else {
              const errorData = pixResponse ? await pixResponse.json().catch(() => ({})) : {};
              alert("Não foi possível processar o pagamento via PIX. Por favor, tente novamente ou entre em contato com o suporte. Detalhes: " + (errorData.error || "Erro na API"));
            }
          } catch (pixErr) {
            console.error("Erro no processamento:", pixErr);
          }
        }

        await clearCart();
        setStep('confirm');
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  if (items.length === 0 && !orderId) {
    navigate('/carrinho');
    return null;
  }

  const steps = [
    { key: 'info' as const, label: 'Dados', num: 1 },
    { key: 'payment' as const, label: 'Pagamento', num: 2 },
    { key: 'confirm' as const, label: 'Confirmação', num: 3 },
  ];

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s.key ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' :
                steps.indexOf(steps.find(x => x.key === step)!) > i ? 'bg-emerald-500 text-white' :
                'bg-white/5 text-gray-500 border border-white/10'
              }`}>
                {steps.indexOf(steps.find(x => x.key === step)!) > i ? <Check size={16} /> : s.num}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${
                step === s.key ? 'text-white' : 'text-gray-500'
              }`}>{s.label}</span>
              {i < steps.length - 1 && <div className="w-12 h-px bg-white/10 mx-2" />}
            </div>
          ))}
        </div>

        {step === 'info' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold text-white mb-6">Dados de Entrega</h2>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400 shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-xs">Embalagem 100% Discreta</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                    Caixa ou envelope pardo totalmente neutro, sem nenhuma menção à loja ou produto.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                  <QrCode size={18} />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-xs">Ganhe 5% de Desconto no PIX</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                    O desconto será aplicado automaticamente na tela de pagamento.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">
                  <Truck size={18} />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-xs">Entrega Garantida e Rastreada</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                    Sua encomenda viaja com <strong>seguro total contra extravio</strong>. Assim que o pedido for despachado, você receberá o <strong>código de rastreio</strong> automaticamente por e-mail e WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Nome completo</label>
                  <input value={form.name} onChange={e => updateForm('name', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.name ? 'border-red-500/50' : 'border-white/10'}`}
                    placeholder="Seu nome" />
                  {errors.name && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">E-mail</label>
                  <input value={form.email} onChange={e => updateForm('email', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.email ? 'border-red-500/50' : 'border-white/10'}`}
                    placeholder="seu@email.com" />
                  {errors.email && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.email}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Telefone</label>
                  <input value={form.phone} onChange={e => updateForm('phone', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.phone ? 'border-red-500/50' : 'border-white/10'}`}
                    placeholder="(11) 99999-9999" />
                  {errors.phone && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">CPF</label>
                  <input value={form.cpf} onChange={e => updateForm('cpf', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.cpf ? 'border-red-500/50' : 'border-white/10'}`}
                    placeholder="000.000.000-00" />
                  {errors.cpf && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.cpf}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">CEP</label>
                <input value={form.cep} onChange={e => updateForm('cep', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.cep ? 'border-red-500/50' : 'border-white/10'}`}
                  placeholder="00000-000" />
                {errors.cep && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.cep}</p>}
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm text-gray-400 mb-1.5 block">Rua</label>
                  <input value={form.street} onChange={e => updateForm('street', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.street ? 'border-red-500/50' : 'border-white/10'}`}
                    placeholder="Rua" />
                  {errors.street && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.street}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Número</label>
                  <input value={form.number} onChange={e => updateForm('number', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.number ? 'border-red-500/50' : 'border-white/10'}`}
                    placeholder="123" />
                  {errors.number && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.number}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Complemento</label>
                  <input value={form.complement} onChange={e => updateForm('complement', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                    placeholder="Apto" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Bairro</label>
                  <input value={form.neighborhood} onChange={e => updateForm('neighborhood', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.neighborhood ? 'border-red-500/50' : 'border-white/10'}`}
                    placeholder="Bairro" />
                  {errors.neighborhood && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.neighborhood}</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Cidade</label>
                  <input value={form.city} onChange={e => updateForm('city', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.city ? 'border-red-500/50' : 'border-white/10'}`}
                    placeholder="Cidade" />
                  {errors.city && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.city}</p>}
                </div>
              </div>
              <div className="w-1/3">
                <label className="text-sm text-gray-400 mb-1.5 block">Estado</label>
                <input value={form.state} onChange={e => updateForm('state', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 ${errors.state ? 'border-red-500/50' : 'border-white/10'}`}
                  placeholder="SP" />
                {errors.state && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.state}</p>}
              </div>
            </div>

            {/* Order summary - also visible in info step */}
            <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/5 mt-8">
              <h3 className="text-white font-semibold mb-4">Resumo do Pedido</h3>
              <div className="space-y-4 mb-6 pb-6 border-b border-white/5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 text-sm">
                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/5">
                      <ProductImage src={item.product?.image_url || null} alt={item.product?.name || ''} brand={item.product?.brand} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium line-clamp-1">{item.product?.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Qtd: {item.quantity} 
                        {(item.flavor || item.color) && ' • '}
                        {item.flavor && <span>{item.flavor}</span>}
                        {item.flavor && item.color && <span className="mx-1">/</span>}
                        {item.color && <span>{item.color}</span>}
                      </div>
                    </div>
                    <div className="text-white font-semibold whitespace-nowrap">
                      R$ {((item.product?.price ?? 0) * item.quantity).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({items.length} itens)</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-cyan-400">
                    <span>Promoção Compre 1 Leve 2</span>
                    <span>-R$ {promoDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Frete {isCepValid && '(Sedex Expresso)'}</span>
                  <span>{!isCepValid ? '-' : shipping === 0 ? <span className="text-emerald-400">Grátis</span> : `R$ ${shipping.toFixed(2).replace('.', ',')}`}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between text-white font-bold text-lg">
                  <span>Total Estimado</span>
                  <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Link to="/carrinho" className="px-6 py-3 text-gray-400 hover:text-white transition-colors text-sm">
                Voltar ao carrinho
              </Link>
              <button onClick={handleNextStep}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/25">
                Continuar
              </button>
            </div>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold text-white mb-6">Forma de Pagamento</h2>

            <div className="space-y-3 mb-8">
              {([
                { key: 'pix' as const, icon: <QrCode size={20} />, label: 'PIX', desc: 'Aprovação imediata - 5% de desconto', color: 'text-cyan-400' },
              ]).map(pm => (
                <button
                  key={pm.key}
                  disabled
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left bg-cyan-500/10 border-cyan-500/30 cursor-default"
                >
                  <div className={`${pm.color}`}>{pm.icon}</div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{pm.label}</div>
                    <div className="text-gray-500 text-sm">{pm.desc}</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-cyan-500 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  </div>
                </button>
              ))}
            </div>


            {/* Order summary */}
            <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/5 mb-8">
              <h3 className="text-white font-semibold mb-4">Resumo do Pedido</h3>
              
              {/* Product List */}
              <div className="space-y-4 mb-6 pb-6 border-b border-white/5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 text-sm">
                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/5">
                      <ProductImage src={item.product?.image_url || null} alt={item.product?.name || ''} brand={item.product?.brand} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium line-clamp-1">{item.product?.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Qtd: {item.quantity} 
                        {(item.flavor || item.color) && ' • '}
                        {item.flavor && <span>{item.flavor}</span>}
                        {item.flavor && item.color && <span className="mx-1">/</span>}
                        {item.color && <span>{item.color}</span>}
                      </div>
                    </div>
                    <div className="text-white font-semibold whitespace-nowrap">
                      R$ {((item.product?.price ?? 0) * item.quantity).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({items.length} itens)</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-cyan-400">
                    <span>Promoção Compre 1 Leve 2</span>
                    <span>-R$ {promoDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Frete {isCepValid && '(Sedex Expresso)'}</span>
                  <span>{!isCepValid ? '-' : shipping === 0 ? <span className="text-emerald-400">Grátis</span> : `R$ ${shipping.toFixed(2).replace('.', ',')}`}</span>
                </div>
                {paymentMethod === 'pix' && !isMasterAdmin && (
                  <div className="flex justify-between text-cyan-400">
                    <span>Desconto PIX (5%)</span>
                    <span>-R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {isMasterAdmin && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Modo Teste (Dono)</span>
                    <span>Valor Especial Aplicado</span>
                  </div>
                )}
                <div className="border-t border-white/5 pt-2 flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {(paymentMethod === 'pix' ? finalTotal - pixDiscount : finalTotal).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-xs mb-6">
              <Lock size={14} /> Pagamento 100% seguro com criptografia SSL
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('info')} className="px-6 py-3 text-gray-400 hover:text-white transition-colors text-sm">
                Voltar
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/25 disabled:opacity-50">
                {submitting ? 'Processando...' : 'Finalizar Pedido'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            {paymentApproved ? (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Check size={40} className="text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Pagamento Confirmado!</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Excelente! Seu pagamento foi recebido com sucesso e seu pedido já está sendo preparado com total discrição.
                </p>
                <div className="mb-8 max-w-md mx-auto space-y-4">
                  <div className="p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-start gap-4 text-left shadow-lg">
                    <div className="p-3 bg-cyan-500/10 rounded-xl shrink-0">
                      <Truck className="text-cyan-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm mb-1.5">Preparação Expressa</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Sua encomenda será embalada com total segurança e discrição, pronta para ser despachada na próxima coleta.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4 text-left shadow-lg relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 rotate-12 pointer-events-none">
                      <Truck size={100} />
                    </div>
                    <div className="p-3 bg-emerald-500/20 rounded-xl shrink-0 relative z-10">
                      <Shield className="text-emerald-400" size={24} />
                    </div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-2 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Entrega 100% Rastreada
                      </div>
                      <h3 className="text-white font-bold text-sm mb-1.5">Acompanhe cada passo do seu pedido</h3>
                      <ul className="text-gray-300 text-xs leading-relaxed space-y-2 mt-3">
                        <li className="flex items-start gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Código de Rastreio Automático:</strong> Enviado direto para o seu e-mail e WhatsApp em até 24h.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Seguro Total Inclusivo:</strong> Garantimos a entrega ou seu dinheiro de volta. Sem riscos.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Atualizações em Tempo Real:</strong> Saiba exatamente onde sua encomenda está a qualquer momento.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Link to="/" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/25">
                    Voltar à Página Inicial
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse border border-cyan-500/30">
                  <QrCode size={40} className="text-cyan-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Aguardando Pagamento</h2>
                
                {timeLeft > 0 ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6 animate-pulse">
                    <span>⏱️ Seu PIX expira em: </span>
                    <span className="font-mono text-sm font-bold">{minutes}:{seconds < 10 ? '0' : ''}{seconds}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-6">
                    <span>⚠️ O código PIX expirou</span>
                  </div>
                )}

                <p className="text-gray-400 mb-2">Escaneie o QR Code ou copie o código PIX para confirmar seu pedido.</p>
                {orderId && <p className="text-gray-500 text-sm mb-8">ID do pedido: {orderId.slice(0, 8).toUpperCase()}</p>}
                
                {pixData && (
                  <div className="mb-8 max-w-sm mx-auto p-6 bg-white/[0.02] border border-white/10 rounded-3xl">
                    <h3 className="text-white font-bold mb-4 flex items-center justify-center gap-2">
                      <QrCode size={20} className="text-cyan-400" /> Pagamento via PIX
                    </h3>
                    <div className="bg-white p-4 rounded-2xl mb-6 inline-block shadow-lg shadow-cyan-500/10">
                      {pixData.pix_qr_code ? (
                        <img 
                          src={pixData.pix_qr_code.startsWith('http') ? pixData.pix_qr_code : (pixData.pix_qr_code.includes('data:image') ? pixData.pix_qr_code : `data:image/png;base64,${pixData.pix_qr_code}`)} 
                          alt="QR Code PIX" 
                          className="w-48 h-48"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
                          QR Code não disponível
                        </div>
                      )}
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 mb-4 text-left">
                      <p className="text-[10px] text-gray-500 font-mono break-all line-clamp-2">{pixData.pix_code}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixData.pix_code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="w-full py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all mb-3"
                    >
                      {copied ? <Check size={18} /> : <FileText size={18} />}
                      {copied ? 'Copiado!' : 'Copiar Código PIX'}
                    </button>

                    <button
                      onClick={handleCheckPayment}
                      disabled={checkingPayment}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all mb-4 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checkingPayment ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check size={18} />
                      )}
                      {checkingPayment ? 'Verificando pagamento...' : 'Já Paguei (Confirmar PIX)'}
                    </button>

                    <div className="text-left pt-4 border-t border-white/5 space-y-3">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Como pagar:</h4>
                      <ol className="text-[11px] text-gray-400 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                        <li>Clique no botão <span className="text-cyan-400 font-medium">"Copiar Código PIX"</span> acima.</li>
                        <li>Abra o aplicativo do seu banco e acesse a área <span className="text-white font-medium">Pix</span>.</li>
                        <li>Selecione <span className="text-white font-medium">"Pix Copia e Cola"</span>, cole o código copiado e conclua seu pagamento.</li>
                      </ol>
                    </div>
                  </div>
                )}

                <div className="mb-8 max-w-md mx-auto space-y-4">
                  <div className="p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-start gap-4 text-left shadow-lg">
                    <div className="p-3 bg-cyan-500/10 rounded-xl shrink-0">
                      <Truck className="text-cyan-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm mb-1.5">Preparação Expressa</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Sua encomenda será embalada com total segurança e discrição, pronta para ser despachada na próxima coleta.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4 text-left shadow-lg relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 rotate-12 pointer-events-none">
                      <Truck size={100} />
                    </div>
                    <div className="p-3 bg-emerald-500/20 rounded-xl shrink-0 relative z-10">
                      <Shield className="text-emerald-400" size={24} />
                    </div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-2 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Entrega 100% Rastreada
                      </div>
                      <h3 className="text-white font-bold text-sm mb-1.5">Acompanhe cada passo do seu pedido</h3>
                      <ul className="text-gray-300 text-xs leading-relaxed space-y-2 mt-3">
                        <li className="flex items-start gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Código de Rastreio Automático:</strong> Enviado direto para o seu e-mail e WhatsApp em até 24h.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Seguro Total Inclusivo:</strong> Garantimos a entrega ou seu dinheiro de volta. Sem riscos.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Atualizações em Tempo Real:</strong> Saiba exatamente onde sua encomenda está a qualquer momento.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Link to="/" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/25">
                    Voltar à Loja
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
