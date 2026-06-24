export default function Logo({ size = 32, textSize = 'text-base', showText = true, white = false }) {
  const color = white ? '#FFFFFF' : '#2563EB';
  const textColor = white ? 'text-white' : 'text-[#0F172A]';
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <rect width="40" height="40" rx="10" fill={color}/>
        <path d="M11 12h12a5 5 0 010 10H11V12z" fill="white"/>
        <path d="M11 22h10a5 5 0 010 10H11V22z" fill="white" opacity="0.55"/>
        <circle cx="30" cy="27" r="4" fill="white"/>
      </svg>
      {showText && (
        <span className={`font-black tracking-tight ${textSize} ${textColor}`} style={{ letterSpacing: '-0.03em' }}>
          FlowAI
        </span>
      )}
    </div>
  );
}
