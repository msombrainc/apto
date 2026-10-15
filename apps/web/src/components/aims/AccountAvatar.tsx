export function accountInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

type AccountAvatarProps = {
  name: string;
  size?: "sm" | "md";
};

export function AccountAvatar({ name, size = "md" }: AccountAvatarProps) {
  return (
    <span
      className={`account-avatar account-avatar--${size}`}
      aria-hidden
      title={name}
    >
      {accountInitials(name)}
    </span>
  );
}
