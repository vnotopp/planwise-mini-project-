import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, AlertTriangle, CheckCircle2, Pencil, Check, X, ShoppingBag } from 'lucide-react';
import { formatCurrency, type Resource } from '@/store/useStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Props {
  resource: Resource;
  eventId: string;
  onUpdate: (data: Partial<Resource>) => void;
  onDelete: () => void;
}

export function InlineResourceRow({ resource: r, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [est, setEst] = useState(r.estimatedCost.toString());
  const [act, setAct] = useState(r.actualCost.toString());

  const diff = r.actualCost - r.estimatedCost;
  const isOver = diff > 0;

  const handleSave = () => {
    const estimatedCost = Math.max(0, Number(est) || 0);
    const actualCost = Math.max(0, Number(act) || 0);
    onUpdate({ estimatedCost, actualCost });
    toast.success(`Updated "${r.name}"`);
    setEditing(false);
  };

  const handleCancel = () => {
    setEst(r.estimatedCost.toString());
    setAct(r.actualCost.toString());
    setEditing(false);
  };

  return (
    <div className={`flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2 border-l-2 transition-colors ${isOver ? 'border-l-destructive' : 'border-l-success'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Badge variant="outline" className="border-border text-[10px] font-mono shrink-0">{r.category}</Badge>
        <span className="text-sm text-foreground truncate">{r.name}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Est:</span>
              <Input
                type="number"
                value={est}
                onChange={(e) => setEst(e.target.value)}
                className="h-7 w-24 text-xs font-mono bg-muted/30 border-border"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Act:</span>
              <Input
                type="number"
                value={act}
                onChange={(e) => setAct(e.target.value)}
                className="h-7 w-24 text-xs font-mono bg-muted/30 border-border"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-success" onClick={handleSave}>
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={handleCancel}>
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground font-mono">Est: {formatCurrency(r.estimatedCost)}</span>
            <span className="text-xs text-muted-foreground font-mono">Act: {formatCurrency(r.actualCost)}</span>
            <span className={`text-xs font-bold font-mono flex items-center gap-1 ${isOver ? 'text-destructive' : 'text-success'}`}>
              {isOver ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              {diff > 0 ? '+' : ''}{formatCurrency(diff)}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEst(r.estimatedCost.toString()); setAct(r.actualCost.toString()); setEditing(true); }}>
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
