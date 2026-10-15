type AlertBannerProps = {
  message: string;
};

export function AlertBanner({ message }: AlertBannerProps) {
  return (
    <div className="aims-alert" role="alert">
      <span className="aims-alert__icon" aria-hidden>!</span>
      <span>{message}</span>
    </div>
  );
}
