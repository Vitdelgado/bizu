// Script para testar o toast
console.log('=== TESTE TOAST ===');

// Simular um toast
const testToast = {
  id: 'test-123',
  title: 'Teste',
  description: 'Este é um teste do toast',
  open: true
};

console.log('Toast de teste criado:', testToast);

// Simular dismiss
const dismiss = (toastId) => {
  console.log('Função dismiss chamada com ID:', toastId);
  return { type: "DISMISS_TOAST", toastId };
};

console.log('Testando dismiss:', dismiss('test-123')); 