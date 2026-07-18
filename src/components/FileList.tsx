import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { AudioFileEntry } from '../hooks/useAudioBinder'
import FileListItem from './FileListItem'

interface Props {
  files: AudioFileEntry[]
  disabled: boolean
  onRemove: (id: string) => void
  onReorder: (activeId: string, overId: string) => void
  onRenameChapter: (id: string, title: string) => void
}

export default function FileList({ files, disabled, onRemove, onReorder, onRenameChapter }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id))
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {files.map((file, index) => (
            <FileListItem
              key={file.id}
              entry={file}
              index={index}
              disabled={disabled}
              onRemove={onRemove}
              onRenameChapter={onRenameChapter}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
