import React, { useEffect, useId } from 'react';
import { Users, FileText, ThumbsUp, Globe, Check, X, AlertCircle } from 'lucide-react';
import { World, Character, WorldStatus, ContentStatus } from '../core/types';
import { Link } from 'react-router-dom';

// --- Utility Components ---

export const Badge: React.FC<{ label: string; color?: 'gold' | 'green' | 'red' | 'gray' }> = ({ label, color = 'gray' }) => {
  const colors = {
    gold: 'bg-accent-muted text-accent-primary border-border-accent',
    green: 'bg-status-canon/10 text-status-canon border-status-canon/20',
    red: 'bg-status-rejected/10 text-status-rejected border-status-rejected/20',
    gray: 'bg-surface-overlay text-text-secondary border-border',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${colors[color]}`}>
      {label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: WorldStatus | ContentStatus }> = ({ status }) => {
  let color: 'green' | 'gold' | 'red' | 'gray' = 'gray';
  
  switch (status) {
    case WorldStatus.OPEN: color = 'green'; break;
    case WorldStatus.INVITE_ONLY: color = 'gold'; break;
    case WorldStatus.CLOSED: color = 'red'; break;
    case ContentStatus.CANON: color = 'green'; break;
    case ContentStatus.PROPOSAL: color = 'gold'; break;
    case ContentStatus.DRAFT: color = 'gray'; break;
    case ContentStatus.REJECTED: color = 'red'; break;
  }

  return <Badge label={status.replace('_', ' ')} color={color} />;
};

export const Button: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  icon?: React.ElementType;
  disabled?: boolean;
}> = ({ children, variant = 'primary', size = 'md', className = '', onClick, icon: Icon, disabled }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-accent-primary text-surface-base hover:bg-accent-hover",
    secondary: "bg-surface-overlay text-text-primary hover:bg-surface-subtle border border-border",
    outline: "border border-border text-text-secondary hover:border-text-tertiary hover:text-text-primary bg-transparent",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-overlay",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-sm px-6 py-3",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={1.5} />}
      {children}
    </button>
  );
};

export const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border animate-slide-up ${
      type === 'success' ? 'bg-surface-elevated border-status-canon/30 text-status-canon' : 'bg-surface-elevated border-status-rejected/30 text-status-rejected'
    }`}>
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      <span className="text-sm font-medium text-text-primary">{message}</span>
      <button onClick={onClose} className="ml-2 text-text-tertiary hover:text-text-primary transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

// --- Form Components ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ElementType;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon: Icon, rightElement, className, id, ...props }) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label htmlFor={inputId} className="text-[11px] font-semibold text-text-tertiary uppercase tracking-widest">{label}</label>}
      <div className="relative group">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors" size={16} strokeWidth={1.5} />}
        <input 
          id={inputId}
          className={`w-full bg-surface-base border border-border rounded-lg py-2.5 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-text-primary text-sm placeholder-text-tertiary focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 outline-none transition-all disabled:opacity-50`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className, id, ...props }) => {
  const generatedId = useId();
  const textAreaId = id ?? generatedId;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label htmlFor={textAreaId} className="text-[11px] font-semibold text-text-tertiary uppercase tracking-widest">{label}</label>}
      <textarea 
        id={textAreaId}
        className="w-full bg-surface-base border border-border rounded-lg p-4 text-text-primary text-sm placeholder-text-tertiary focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 outline-none transition-all min-h-[120px] resize-y"
        {...props}
      />
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className, id, ...props }) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label htmlFor={selectId} className="text-[11px] font-semibold text-text-tertiary uppercase tracking-widest">{label}</label>}
      <div className="relative">
        <select 
          id={selectId}
          className="w-full bg-surface-base border border-border rounded-lg py-2.5 pl-4 pr-10 text-text-primary text-sm focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 outline-none transition-all appearance-none cursor-pointer"
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  );
};

// --- Card Components ---

export const WorldCard: React.FC<{ world: World }> = ({ world }) => {
  const govLabel = world.governance === 'COMMUNITY_VOTE' ? 'Democracy' : world.governance === 'LOREKEEPER_COUNCIL' ? 'Council' : 'Creator Led';

  return (
    <Link to={`/world/${world.id}`} className="group block h-full">
      <article className="h-full flex flex-col bg-surface-elevated border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-border-accent hover:-translate-y-0.5">
        {/* Hero Image */}
        <div className="relative h-44 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-elevated via-transparent to-transparent z-10" />
          <img 
            src={world.heroImage} 
            alt={world.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 z-20">
            <StatusBadge status={world.status} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="mb-3">
            <h3 className="font-serif text-xl text-text-primary group-hover:text-accent-primary transition-colors duration-200">
              {world.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {world.genre.map(g => (
                <span key={g} className="text-[11px] text-text-tertiary">#{g}</span>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1 leading-relaxed">
            {world.description}
          </p>

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-4 text-[11px] text-text-tertiary">
              <div className="flex items-center gap-1.5">
                <Users size={12} />
                <span>{world.memberCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText size={12} />
                <span>{world.characterCount} entries</span>
              </div>
            </div>
            
            <div className="text-[11px] font-medium text-accent-primary">
              {govLabel}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export const CharacterCard: React.FC<{ character: Character; worldName?: string }> = ({ character, worldName }) => {
  const netScore = character.votes.up - character.votes.down;

  return (
    <Link to={`/world/${character.worldId}`} className="group block">
      <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-border-accent hover:-translate-y-0.5">
        <div className="flex gap-4 p-4">
          {/* Avatar */}
          <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-surface-overlay">
            <img 
              src={character.imageUrl} 
              alt={character.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-serif text-base text-text-primary truncate pr-2 group-hover:text-accent-primary transition-colors">{character.name}</h4>
                <p className="text-[11px] text-accent-primary mt-0.5">{character.archetype}</p>
              </div>
              <StatusBadge status={character.status} />
            </div>
            
            <p className="text-xs text-text-secondary line-clamp-2 mt-2 leading-relaxed">
              {character.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-surface-base/50 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <ThumbsUp size={11} />
              <span className={netScore > 0 ? 'text-status-canon' : ''}>{netScore > 0 ? `+${netScore}` : netScore}</span>
            </div>
            {worldName && (
              <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <Globe size={11} />
                <span className="truncate max-w-[100px]">{worldName}</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium">
            {new Date(character.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
};
