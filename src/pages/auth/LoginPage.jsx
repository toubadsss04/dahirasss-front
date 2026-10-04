import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';

import logo from '../../assets/logo.png';
import { ROUTES } from '../../constants/routes';
import { extractErrorMessage } from '../../services/apiClient';
import { IDENTIFIER_STATUS, fetchIdentifierStatus } from '../../services/auth.service';
import { useSlowRequestNotice } from '../../hooks/useSlowRequestNotice';
import { useAuthStore } from '../../store/authStore';
import { avatarColor, initials } from '../../utils/format';
import { prepareOpeningSound, setLoginFlag } from '../../utils/soundService';
import {
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validatePassword,
} from '../../utils/validation';
import './LoginPage.css';

const STEPS = {
  IDENTIFIER: 'IDENTIFIER',
  PASSWORD: 'PASSWORD',
  CREATE_PASSWORD: 'CREATE_PASSWORD',
  BLOCKED: 'BLOCKED',
};

/**
 * Sign-in screen driven by the identifier step.
 *
 * The API answers which of three branches applies: ask for a password, offer
 * to create one, or block the account until an administrator authorizes it.
 * Authorization is checked before the password state, so an account waiting
 * for approval never reaches the password fields.
 *
 * @returns {JSX.Element} The sign-in screen.
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);
  const createPassword = useAuthStore((state) => state.createPassword);

  const [step, setStep] = useState(STEPS.IDENTIFIER);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const isSlow = useSlowRequestNotice(isBusy);

  const resetToIdentifier = () => {
    setStep(STEPS.IDENTIFIER);
    setPassword('');
    setConfirmation('');
    setError('');
    setFullName(null);
  };

  const handleIdentifierSubmit = async (event) => {
    event.preventDefault();
    const invalid = validateEmail(email);
    if (invalid) {
      setError(invalid);
      return;
    }

    setIsBusy(true);
    setError('');
    try {
      const result = await fetchIdentifierStatus(email.trim());
      setFullName(result.full_name);

      if (result.status === IDENTIFIER_STATUS.PASSWORD_REQUIRED) {
        setStep(STEPS.PASSWORD);
      } else if (result.status === IDENTIFIER_STATUS.PASSWORD_NOT_SET) {
        setStep(STEPS.CREATE_PASSWORD);
      } else if (result.status === IDENTIFIER_STATUS.NOT_AUTHORIZED) {
        setStep(STEPS.BLOCKED);
      } else {
        setError(t('auth.identifier.unknown'));
      }
    } catch (requestError) {
      setError(extractErrorMessage(requestError, 'auth.identifier.failed'));
    } finally {
      setIsBusy(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    // Claimed on the tap that signs in, and on no earlier one: this screen
    // asks for the address first, and a browser grants the right to play from
    // inside a tap, which the sign-in answer is far too late to be part of.
    prepareOpeningSound();

    setIsBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      setLoginFlag();
      navigate(ROUTES.dashboard, { replace: true });
    } catch (requestError) {
      setError(extractErrorMessage(requestError, 'auth.password.failed'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreatePasswordSubmit = async (event) => {
    event.preventDefault();
    const invalid = validatePassword(password);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (password !== confirmation) {
      setError(t('auth.createPassword.mismatch'));
      return;
    }

    prepareOpeningSound();
    setIsBusy(true);
    setError('');
    try {
      await createPassword(email.trim(), password);
      setLoginFlag();
      navigate(ROUTES.dashboard, { replace: true });
    } catch (requestError) {
      setError(extractErrorMessage(requestError, 'auth.createPassword.failed'));
    } finally {
      setIsBusy(false);
    }
  };

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setShowPassword((visible) => !visible)}
        edge="end"
        size="small"
        aria-label={showPassword ? t('auth.password.hide') : t('auth.password.show')}
      >
        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
      </IconButton>
    </InputAdornment>
  );

  const identityCard = (
    <div className="login__identity">
      <div
        className="login__identity-avatar"
        style={{ background: avatarColor(fullName || email) }}
      >
        {initials(fullName || email)}
      </div>
      <div className="login__identity-body">
        <div className="login__identity-name">{fullName || t('auth.account')}</div>
        <div className="login__identity-mail">{email.trim()}</div>
      </div>
      <button type="button" className="login__link" onClick={resetToIdentifier}>
        {t('auth.changeIdentifier')}
      </button>
    </div>
  );

  const busyIcon = <CircularProgress size={16} color="inherit" />;

  // Shown only when a call really drags, which on a weak mobile connection
  // reassures better than a spinner that looks stuck.
  const wakingNotice = isSlow && (
    <Alert severity="info">{t('common.slowRequest')}</Alert>
  );

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <img src={logo} alt={t('common.logoAlt')} />
        </div>

        {step === STEPS.IDENTIFIER && (
          <>
            <h1 className="login__title">{t('auth.identifier.title')}</h1>
            <p className="login__subtitle">{t('auth.identifier.subtitle')}</p>
            <form className="login__form" onSubmit={handleIdentifierSubmit} noValidate>
              {error && <Alert severity="error">{error}</Alert>}
              {wakingNotice}
              <TextField
                label={t('auth.identifier.field')}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                autoFocus
                fullWidth
                size="small"
                disabled={isBusy}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isBusy}
                endIcon={isBusy ? busyIcon : <ArrowRight size={17} />}
              >
                {t('auth.identifier.submit')}
              </Button>
            </form>
          </>
        )}

        {step === STEPS.PASSWORD && (
          <>
            <h1 className="login__title">{t('auth.password.title')}</h1>
            <p className="login__subtitle">{t('auth.password.subtitle')}</p>
            <form className="login__form" onSubmit={handlePasswordSubmit} noValidate>
              {identityCard}
              {error && <Alert severity="error">{error}</Alert>}
              {wakingNotice}
              <TextField
                label={t('auth.password.field')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
                fullWidth
                size="small"
                disabled={isBusy}
                InputProps={{ endAdornment: passwordAdornment }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isBusy || !password}
                endIcon={isBusy ? busyIcon : <ArrowRight size={17} />}
              >
                {t('auth.password.submit')}
              </Button>
            </form>
          </>
        )}

        {step === STEPS.CREATE_PASSWORD && (
          <>
            <h1 className="login__title">{t('auth.createPassword.title')}</h1>
            <p className="login__subtitle">{t('auth.createPassword.subtitle')}</p>
            <form className="login__form" onSubmit={handleCreatePasswordSubmit} noValidate>
              {identityCard}
              {error && <Alert severity="error">{error}</Alert>}
              {wakingNotice}
              <TextField
                label={t('auth.createPassword.field')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                autoFocus
                fullWidth
                size="small"
                disabled={isBusy}
                InputProps={{ endAdornment: passwordAdornment }}
              />
              <TextField
                label={t('auth.createPassword.confirmField')}
                type={showPassword ? 'text' : 'password'}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                fullWidth
                size="small"
                disabled={isBusy}
              />
              <p className="login__hint">
                {t('auth.createPassword.hint', { min: PASSWORD_MIN_LENGTH })}
              </p>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isBusy || !password || !confirmation}
                endIcon={isBusy ? busyIcon : <ArrowRight size={17} />}
              >
                {t('auth.createPassword.submit')}
              </Button>
            </form>
          </>
        )}

        {step === STEPS.BLOCKED && (
          <>
            <div className="login__blocked">
              <div className="login__blocked-icon">
                <ShieldAlert size={26} />
              </div>
              <h1 className="login__title">{t('auth.blocked.title')}</h1>
              <p className="login__subtitle" style={{ margin: 0 }}>
                {t('auth.blocked.body')}
              </p>
            </div>
            <Button
              variant="outlined"
              fullWidth
              onClick={resetToIdentifier}
              startIcon={<ArrowLeft size={17} />}
            >
              {t('auth.blocked.restart')}
            </Button>
          </>
        )}

      </div>
    </div>
  );
}
