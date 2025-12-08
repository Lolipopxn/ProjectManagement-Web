export default function TaskCard({ task, overlay = false }: any) {
  return (
    <div
      className={`p-4 rounded-lg shadow-md border bg-white w-[200px] 
        ${overlay ? "shadow-xl scale-105" : ""}`}
    >
      <h3 className="font-semibold text-gray-800">{task.task_name}</h3>
      <p className="text-sm text-gray-600">{task.description}</p>
      <span className="text-xs text-blue-600 mt-2 inline-block">
        {task.task_status}
      </span>
    </div>
  );
}