import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from './button';

type Props = {
  // id do <form> que o Salvar envia (o botão fica fora dele, no cabeçalho).
  formId: string;
  submitting?: boolean;
  onCancel: () => void;
};

// Cancelar + Salvar no cabeçalho das telas de formulário (padrão de editor:
// nada fixo embaixo disputando espaço com o teclado).
export function FormHeaderActions({ formId, submitting, onCancel }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={submitting}
      >
        {t('common.cancel')}
      </Button>
      <Button
        type="submit"
        form={formId}
        size="sm"
        disabled={submitting}
        leadingIcon={<Check className="h-4 w-4" />}
      >
        {t('common.save')}
      </Button>
    </>
  );
}
