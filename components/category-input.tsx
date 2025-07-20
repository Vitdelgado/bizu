import { useState, useEffect } from 'react';
import styles from './category-input.module.css';

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CategoryInput({ value, onChange, placeholder = "Digite categorias...", className = "" }: CategoryInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    setInputValue(value);
    setCategories(value.split(',').map(cat => cat.trim()).filter(Boolean));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Se termina com vírgula, processar categorias
    if (newValue.endsWith(',')) {
      const newCategories = newValue
        .slice(0, -1) // Remove a vírgula final
        .split(',')
        .map(cat => cat.trim())
        .filter(Boolean);
      
      setCategories(newCategories);
      onChange(newCategories.join(', '));
      setInputValue(''); // Limpar input para próxima categoria
    } else {
      // Atualizar valor normalmente
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newCategories = [...categories];
      if (inputValue.trim()) {
        newCategories.push(inputValue.trim());
        setCategories(newCategories);
        onChange(newCategories.join(', '));
        setInputValue('');
      }
    }
  };

  const removeCategory = (index: number) => {
    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
    onChange(newCategories.join(', '));
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={categories.length === 0 ? placeholder : "Digite outra categoria..."}
          className={styles.input}
        />
      </div>
      
      {categories.length > 0 && (
        <div className={styles.categoriesContainer}>
          {categories.map((category, index) => (
            <span key={index} className={styles.categoryTag}>
              {category}
              <button
                type="button"
                onClick={() => removeCategory(index)}
                className={styles.removeButton}
                title="Remover categoria"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      <small className={styles.helpText}>
        Digite categorias e pressione Enter ou vírgula para separar
      </small>
    </div>
  );
} 