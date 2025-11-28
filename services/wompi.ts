
interface WompiOptions {
    currency: string;
    amountInCents: number;
    reference: string;
    publicKey: string;
    redirectUrl?: string; // URL para redirigir tras el pago
    customerData?: {
        email: string;
        fullName: string;
        phoneNumber?: string;
        phoneNumberPrefix?: string;
        legalId?: string;
        legalIdType?: string;
    }
}

declare global {
    interface Window {
        WidgetCheckout: any;
    }
}

// Helper to safely access env vars
const getEnv = (key: string, defaultValue: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || defaultValue;
    }
  } catch (e) {
    // Ignore errors
  }
  return defaultValue;
};

export const startWompiPayment = (userEmail: string, userName: string, onCompleted: () => void) => {
    // 1. Cargar el script de Wompi dinámicamente si no existe
    if (!document.getElementById('wompi-script')) {
        const script = document.createElement('script');
        script.id = 'wompi-script';
        script.src = 'https://checkout.wompi.co/widget.js';
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = () => {
            openWidget(userEmail, userName);
        };
    } else {
        openWidget(userEmail, userName);
    }

    function openWidget(email: string, fullName: string) {
        const checkout = new window.WidgetCheckout({
            currency: 'COP',
            amountInCents: 3990000, // $39.900 COP
            reference: `jurisia-${Date.now()}`, // Referencia única
            publicKey: getEnv('VITE_WOMPI_PUBLIC_KEY', 'PUB_TEST_XoT8TA41l5z52352'), // Reemplazar con tu llave pública real
            redirectUrl: window.location.href, // Redirige a la misma página para procesar
            customerData: {
                email: email,
                fullName: fullName,
                phoneNumber: '3000000000',
                phoneNumberPrefix: '+57'
            }
        });

        checkout.open((result: any) => {
            const transaction = result.transaction;
            if (transaction.status === 'APPROVED') {
                onCompleted();
            }
        });
    }
};