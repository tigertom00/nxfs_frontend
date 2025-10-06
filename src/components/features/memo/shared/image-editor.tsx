'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Stage,
  Layer,
  Line,
  Text as KonvaText,
  Image as KonvaImage,
  Transformer,
  Rect,
} from 'react-konva';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pen,
  Type,
  Square,
  Circle,
  Undo2,
  Redo2,
  Eraser,
  Download,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
} from 'lucide-react';

export type Tool =
  | 'pen'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'eraser'
  | 'select'
  | 'crop';

export interface DrawingElement {
  id: string;
  type: Tool;
  points?: number[];
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
}

interface ImageEditorProps {
  imageUrl: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });

  const stageRef = useRef<Konva.Stage>(null);
  const currentLineRef = useRef<DrawingElement | null>(null);
  const imageRef = useRef<Konva.Image>(null);
  const cropTransformerRef = useRef<Konva.Transformer>(null);
  const cropRectRef = useRef<Konva.Rect>(null);

  // Load image
  useEffect(() => {
    const img = new window.Image();

    // Use proxy for external images to avoid CORS issues
    const proxyUrl = imageUrl.startsWith('http')
      ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;

    img.src = proxyUrl;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Set stage size to match image
      const maxWidth = 800;
      const maxHeight = 600;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      setStageSize({
        width: img.width * scale,
        height: img.height * scale,
      });
      // Initialize crop rect to cover the image
      setCropRect({
        x: 0,
        y: 0,
        width: img.width * scale,
        height: img.height * scale,
      });
    };
    img.onerror = () => {
      // Image load error - silently fail
    };
  }, [imageUrl]);

  // Attach transformer to crop rectangle when in crop mode
  useEffect(() => {
    if (cropMode && cropTransformerRef.current && cropRectRef.current) {
      cropTransformerRef.current.nodes([cropRectRef.current]);
      cropTransformerRef.current.getLayer()?.batchDraw();
    }
  }, [cropMode]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (tool === 'select' || tool === 'crop') {return;}

    setIsDrawing(true);
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) {return;}

    if (tool === 'pen' || tool === 'eraser') {
      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: tool,
        points: [pos.x, pos.y],
        stroke: tool === 'eraser' ? '#FFFFFF' : color,
        strokeWidth: tool === 'eraser' ? strokeWidth * 2 : strokeWidth,
      };
      currentLineRef.current = newElement;
      setElements([...elements, newElement]);
    } else if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newElement: DrawingElement = {
          id: Date.now().toString(),
          type: 'text',
          text,
          x: pos.x,
          y: pos.y,
          fill: color,
          fontSize: strokeWidth * 8,
        };
        addToHistory([...elements, newElement]);
        setElements([...elements, newElement]);
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing || tool === 'text' || tool === 'select' || tool === 'crop')
      {return;}

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos || !currentLineRef.current) {return;}

    if (tool === 'pen' || tool === 'eraser') {
      const lastLine = elements[elements.length - 1];
      if (lastLine && lastLine.points) {
        lastLine.points = lastLine.points.concat([pos.x, pos.y]);
        setElements([...elements.slice(0, -1), lastLine]);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && (tool === 'pen' || tool === 'eraser')) {
      addToHistory(elements);
    }
    setIsDrawing(false);
    currentLineRef.current = null;
  };

  const addToHistory = (newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep === 0) {return;}
    setHistoryStep(historyStep - 1);
    setElements(history[historyStep - 1]);
  };

  const handleRedo = () => {
    if (historyStep === history.length - 1) {return;}
    setHistoryStep(historyStep + 1);
    setElements(history[historyStep + 1]);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleFlipHorizontal = () => {
    setScaleX((prev) => prev * -1);
  };

  const handleFlipVertical = () => {
    setScaleY((prev) => prev * -1);
  };

  const handleToggleCropMode = () => {
    setCropMode(!cropMode);
    if (!cropMode) {
      setTool('crop');
      // Reset crop rect to full image
      setCropRect({
        x: 0,
        y: 0,
        width: stageSize.width,
        height: stageSize.height,
      });
    } else {
      setTool('pen');
    }
  };

  const handleApplyCrop = () => {
    if (!stageRef.current || !cropMode) {return;}

    // Create a temporary canvas to crop the image
    const stage = stageRef.current;

    // Calculate the actual crop area
    const pixelRatio = 1;
    const dataUrl = stage.toDataURL({
      x: cropRect.x,
      y: cropRect.y,
      width: cropRect.width,
      height: cropRect.height,
      pixelRatio,
      mimeType: 'image/png',
      quality: 1,
    });

    // Load the cropped image
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      setStageSize({
        width: cropRect.width,
        height: cropRect.height,
      });
      setCropMode(false);
      setTool('pen');
      setElements([]); // Clear annotations after crop
      setHistory([[]]);
      setHistoryStep(0);
    };
    img.src = dataUrl;
  };

  const handleSave = () => {
    if (!stageRef.current) {return;}

    // If in crop mode, apply crop first
    if (cropMode) {
      const dataUrl = stageRef.current.toDataURL({
        x: cropRect.x,
        y: cropRect.y,
        width: cropRect.width,
        height: cropRect.height,
        mimeType: 'image/png',
        quality: 1,
      });
      onSave(dataUrl);
    } else {
      const dataUrl = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
      });
      onSave(dataUrl);
    }
  };

  const colors = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
    '#800080',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-card border-b p-4 space-y-4">
        {/* Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-sm font-medium">Tools:</Label>
          <Button
            size="sm"
            variant={tool === 'pen' ? 'default' : 'outline'}
            onClick={() => {
              setTool('pen');
              setCropMode(false);
            }}
            disabled={cropMode}
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'text' ? 'default' : 'outline'}
            onClick={() => {
              setTool('text');
              setCropMode(false);
            }}
            disabled={cropMode}
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'eraser' ? 'default' : 'outline'}
            onClick={() => {
              setTool('eraser');
              setCropMode(false);
            }}
            disabled={cropMode}
          >
            <Eraser className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button
            size="sm"
            variant="outline"
            onClick={handleUndo}
            disabled={historyStep === 0 || cropMode}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRedo}
            disabled={historyStep === history.length - 1 || cropMode}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Transform Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-sm font-medium">Transform:</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRotateLeft}
            disabled={cropMode}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRotateRight}
            disabled={cropMode}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleFlipHorizontal}
            disabled={cropMode}
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleFlipVertical}
            disabled={cropMode}
          >
            <FlipVertical className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button
            size="sm"
            variant={cropMode ? 'default' : 'outline'}
            onClick={handleToggleCropMode}
          >
            <Crop className="h-4 w-4 mr-1" />
            {cropMode ? 'Cancel Crop' : 'Crop'}
          </Button>
          {cropMode && (
            <Button size="sm" onClick={handleApplyCrop}>
              Apply Crop
            </Button>
          )}
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-sm font-medium">Color:</Label>
          {colors.map((c) => (
            <button
              key={c}
              className={`w-8 h-8 rounded border-2 ${
                color === c ? 'border-primary' : 'border-border'
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-8"
          />
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium min-w-[100px]">
            Brush Size: {strokeWidth}px
          </Label>
          <Slider
            value={[strokeWidth]}
            onValueChange={([value]) => setStrokeWidth(value)}
            min={1}
            max={20}
            step={1}
            className="w-48"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button onClick={onCancel} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-muted/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg" style={{ touchAction: 'none' }}>
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <Layer>
              {/* Background Image */}
              {image && (
                <KonvaImage
                  ref={imageRef}
                  image={image}
                  x={stageSize.width / 2}
                  y={stageSize.height / 2}
                  offsetX={stageSize.width / 2}
                  offsetY={stageSize.height / 2}
                  width={stageSize.width}
                  height={stageSize.height}
                  rotation={rotation}
                  scaleX={scaleX}
                  scaleY={scaleY}
                />
              )}

              {/* Drawing Elements (only show when not in crop mode) */}
              {!cropMode &&
                elements.map((element) => {
                  if (element.type === 'pen' || element.type === 'eraser') {
                    return (
                      <Line
                        key={element.id}
                        points={element.points}
                        stroke={element.stroke}
                        strokeWidth={element.strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        globalCompositeOperation={
                          element.type === 'eraser'
                            ? 'destination-out'
                            : 'source-over'
                        }
                      />
                    );
                  } else if (element.type === 'text') {
                    return (
                      <KonvaText
                        key={element.id}
                        text={element.text}
                        x={element.x}
                        y={element.y}
                        fill={element.fill}
                        fontSize={element.fontSize}
                        draggable
                      />
                    );
                  }
                  return null;
                })}

              {/* Crop Mode Elements */}
              {cropMode && (
                <>
                  {/* Grey overlay */}
                  <Rect
                    x={0}
                    y={0}
                    width={stageSize.width}
                    height={stageSize.height}
                    fill="rgba(0, 0, 0, 0.5)"
                  />

                  {/* Crop rectangle */}
                  <Rect
                    ref={cropRectRef}
                    x={cropRect.x}
                    y={cropRect.y}
                    width={cropRect.width}
                    height={cropRect.height}
                    fill="transparent"
                    stroke="#00FF00"
                    strokeWidth={2}
                    draggable
                    onDragEnd={(e) => {
                      setCropRect({
                        ...cropRect,
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      setCropRect({
                        x: node.x(),
                        y: node.y(),
                        width: node.width() * node.scaleX(),
                        height: node.height() * node.scaleY(),
                      });
                      node.scaleX(1);
                      node.scaleY(1);
                    }}
                  />

                  {/* Transformer for crop rectangle */}
                  <Transformer
                    ref={cropTransformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Limit resize to stage bounds
                      if (newBox.width < 50 || newBox.height < 50) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                </>
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
