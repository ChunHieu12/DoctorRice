/**
 * Custom Alert Hook
 * Context and hook to show custom alerts from anywhere in the app
 */
import CustomAlert, { AlertButton, AlertType } from '@/components/ui/CustomAlert';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AlertConfig {
  type: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface CustomAlertContextType {
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

const CustomAlertContext = createContext<CustomAlertContextType | undefined>(undefined);

interface CustomAlertProviderProps {
  children: ReactNode;
}

export const CustomAlertProvider: React.FC<CustomAlertProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (alertConfig: AlertConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return (
    <CustomAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        type={config.type}
        title={config.title}
        message={config.message}
        buttons={config.buttons}
        onDismiss={hideAlert}
      />
    </CustomAlertContext.Provider>
  );
};

export const useCustomAlert = (): CustomAlertContextType => {
  const context = useContext(CustomAlertContext);
  
  if (context === undefined) {
    throw new Error('useCustomAlert must be used within CustomAlertProvider');
  }
  
  return context;
};

/**
 * Helper function to replace Alert.alert() calls
 * Usage: 
 * - alert('Success', 'Operation completed')
 * - alert('Error', 'Something went wrong', 'error')
 */
export const createAlertHelper = (showAlert: (config: AlertConfig) => void) => {
  return (
    title: string,
    message?: string,
    type: AlertType = 'info',
    buttons?: AlertButton[]
  ) => {
    showAlert({
      type,
      title,
      message,
      buttons: buttons || [{ text: 'Đóng', style: 'default' }],
    });
  };
};

export default useCustomAlert;

