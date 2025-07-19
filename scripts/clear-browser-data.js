// Script para ser executado no console do navegador
// Cole este código no console do Chrome (F12)

console.log('🧹 Limpando dados do navegador...');

// Limpar localStorage
try {
  localStorage.clear();
  console.log('✅ localStorage limpo');
} catch (error) {
  console.log('❌ Erro ao limpar localStorage:', error);
}

// Limpar sessionStorage
try {
  sessionStorage.clear();
  console.log('✅ sessionStorage limpo');
} catch (error) {
  console.log('❌ Erro ao limpar sessionStorage:', error);
}

// Limpar cookies do domínio atual
try {
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  });
  console.log('✅ Cookies limpos');
} catch (error) {
  console.log('❌ Erro ao limpar cookies:', error);
}

// Limpar cache do service worker (se existir)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
    console.log('✅ Service workers removidos');
  });
}

console.log('🎉 Limpeza concluída! Recarregue a página (Ctrl + R)'); 