import React from 'react';
import { SasPayModal } from './SasPayModal';
import { SubscriptionPlanId } from '../../types';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: SubscriptionPlanId;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = (props) => {
  return <SasPayModal {...props} />;
};

export { SasPayModal };
