import './App.css'
import { WaveformRecorder } from '@/components/WaveformRecorder'

function App() {
  const handleRecordingComplete = () => {
    return; // You can process the audio blob here
  };

  return (
    <div className="min-h-screen">
      <h1 className='text-6xl font-bold text-center pt-8 mb-8'>DaBaby</h1>
      <div className="flex items-center justify-center px-4">
        <WaveformRecorder onRecordingComplete={handleRecordingComplete} />
      </div>
    </div>
  )
}

export default App
