import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BuyRequirements() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/properties/requirements', { replace: true });
  }, [navigate]);
  return null;
}
