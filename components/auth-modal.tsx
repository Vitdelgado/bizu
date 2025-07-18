import { useState } from 'react';
import styles from './auth-modal.module.css';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '../hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        // Para signup, precisamos criar o usuário no Supabase Auth e depois no nosso banco
        await signUp(email, password, { name, phone });
        toast({
          title: 'Conta criada!',
          description: 'Verifique seu email para confirmar a conta.',
        });
        resetForm();
      } else {
        await signIn(email, password);
        toast({
          title: 'Login realizado!',
          description: 'Bem-vindo ao BizuDesk.',
        });
        onOpenChange(false);
        resetForm();
      }
    } catch (error: unknown) {
      let message = 'Ocorreu um erro durante a autenticação.';
      if (error instanceof Error) message = error.message;
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <div className={styles.dialog} style={{ display: open ? 'flex' : 'none' }}>
      <div className={styles.dialogContent}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>
            {isSignUp ? 'Criar conta' : 'Entrar no BizuDesk'}
          </h2>
          <p className={styles.dialogSubtitle}>
            {isSignUp ? 'Crie sua conta para continuar' : 'Acesse sua conta para continuar'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignUp && (
            <div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                required={isSignUp}
                className={styles.input}
              />
            </div>
          )}
          {isSignUp && (
            <div>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefone (opcional)"
                className={styles.input}
              />
            </div>
          )}
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@curseduca.com"
              required
              className={styles.input}
            />
          </div>
          <div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={styles.input}
            />
          </div>
          <Button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Carregando...' : (isSignUp ? 'Criar conta' : 'Entrar')}
          </Button>
        </form>
        <div className={styles.switchMode}>
          <p>
            {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}
            <button
              type="button"
              className={styles.switchBtn}
              onClick={handleModeSwitch}
            >
              {isSignUp ? 'Fazer login' : 'Criar conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 