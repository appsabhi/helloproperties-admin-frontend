import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SellProperties() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/properties', { replace: true });
  }, [navigate]);
  return null;
}
