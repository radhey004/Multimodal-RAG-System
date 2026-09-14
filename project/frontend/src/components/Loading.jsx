export default function Loading({
  text = "Loading..."
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">

      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black" />

      <span className="text-gray-600">
        {text}
      </span>

    </div>
  );
}