/**
 * useHasIoTFields Hook
 * Check if user has any fields with IoT connections
 */

import { getFields } from '@/services/field.service';
import type { Field } from '@/types';
import { useEffect, useState } from 'react';

export interface UseHasIoTFieldsReturn {
  hasIoTFields: boolean;
  iotFields: Field[];
  loading: boolean;
  refresh: () => Promise<{ hasIoT: boolean; fields: Field[] }>;
}

export const useHasIoTFields = (): UseHasIoTFieldsReturn => {
  const [hasIoTFields, setHasIoTFields] = useState(false);
  const [iotFields, setIoTFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  const checkIoTFields = async (): Promise<{ hasIoT: boolean; fields: Field[] }> => {
    try {
      setLoading(true);
      const response = await getFields();
      
      if (response.success && response.data) {
        // Filter fields that have IoT connections
        const fieldsWithIoT = response.data.filter(
          (field: Field) => field.hasIoTConnection || field.iotConnection
        );
        
        setIoTFields(fieldsWithIoT);
        setHasIoTFields(fieldsWithIoT.length > 0);
        
        console.log('📡 IoT Fields check:', {
          totalFields: response.data.length,
          iotFields: fieldsWithIoT.length,
          hasIoT: fieldsWithIoT.length > 0,
        });
        
        return { hasIoT: fieldsWithIoT.length > 0, fields: fieldsWithIoT };
      }
      
      return { hasIoT: false, fields: [] };
    } catch (error) {
      console.error('❌ Error checking IoT fields:', error);
      setHasIoTFields(false);
      setIoTFields([]);
      return { hasIoT: false, fields: [] };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIoTFields();
  }, []);

  return {
    hasIoTFields,
    iotFields,
    loading,
    refresh: checkIoTFields,
  };
};

export default useHasIoTFields;

