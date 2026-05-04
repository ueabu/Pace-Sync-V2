import { PacelistCoursePlayground } from '@/components/course/pacelist-course-playground';

export default function Home() {
  return (
    <div className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
      <PacelistCoursePlayground />
    </div>
  );
}
