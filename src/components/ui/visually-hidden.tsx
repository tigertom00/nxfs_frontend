import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function VisuallyHidden({
  children,
  asChild = false,
}: VisuallyHiddenProps) {
  const style = {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: 0,
  };

  if (asChild && React.isValidElement(children)) {
    // Type assertion to ensure we can safely access props and style
    const element = children as React.ReactElement<any>;
    return React.cloneElement(element, {
      ...element.props,
      style: { ...element.props.style, ...style },
    });
  }

  return <span style={style}>{children}</span>;
}
