import { RUN_ERROR_CODES } from '@workflow/errors';
import type { Step, WorkflowRun } from '@workflow/world';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn, formatDuration } from '~/lib/utils';

/** Extract the error code from an unknown error value (StructuredError shape). */
function getErrorCode(error: unknown): string | undefined {
  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }
  return undefined;
}

function isInfrastructureError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code !== undefined && code !== RUN_ERROR_CODES.USER_ERROR;
}

interface StatusBadgeProps {
  status: WorkflowRun['status'] | Step['status'];
  context?: { error?: unknown };
  className?: string;
  /** Duration in milliseconds to display below status */
  durationMs?: number;
}

export function StatusBadge({
  status,
  context,
  className,
  durationMs,
}: StatusBadgeProps) {
  const isInfra = status === 'failed' && isInfrastructureError(context?.error);

  const getCircleColor = () => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-emerald-500';
      case 'failed':
        return isInfra ? 'bg-amber-500' : 'bg-red-500';
      case 'cancelled':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const content = (
    <span className={cn('flex flex-row gap-2', className)}>
      <span className="flex items-center gap-1.5">
        <span
          className={cn('size-2 rounded-full shrink-0', getCircleColor())}
        />
        <span className="text-muted-foreground text-xs font-medium capitalize">
          {status}
        </span>
      </span>
      {durationMs !== undefined && (
        <span className="text-muted-foreground/70 text-xs">
          ({formatDuration(durationMs)})
        </span>
      )}
    </span>
  );

  // Show error tooltip if status is failed and error exists
  if (status === 'failed' && context?.error) {
    return (
      <ErrorStatusBadge
        content={content}
        error={context.error}
        isInfrastructure={isInfra}
      />
    );
  }

  return content;
}

function ErrorStatusBadge({
  content,
  error,
  isInfrastructure,
}: {
  content: React.ReactNode;
  error: unknown;
  isInfrastructure: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const errorMessage =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : JSON.stringify(error);

  const errorCode = getErrorCode(error);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(errorMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{content}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-md p-0">
        <div className="flex items-start justify-between gap-2 p-1 border-b">
          <span className="text-xs font-medium pl-1 pt-1">
            {isInfrastructure ? 'Internal Error' : 'Error Details'}
            {errorCode && (
              <span className="text-muted-foreground/60 ml-1.5 font-normal">
                {errorCode}
              </span>
            )}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-2.5 w-2.5 text-muted-foreground" />
            ) : (
              <Copy className="h-2.5 w-2.5 text-muted-foreground" />
            )}
          </Button>
        </div>
        <div className="max-h-48 overflow-auto p-2">
          <p className="text-xs whitespace-pre-wrap break-words font-mono">
            {errorMessage}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
