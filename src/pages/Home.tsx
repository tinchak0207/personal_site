import { useStore } from '../store/useStore';
import { BootSequence } from '../components/BootSequence';
import { CRTEffects } from '../components/CRTEffects';
import { ExitButton } from '../components/ExitButton';
import { Graph } from '../components/Graph';

export default function Home() {
  const isBooting = useStore(state => state.isBooting);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">
      {isBooting && <BootSequence />}
      <CRTEffects />
      <Graph />
      <ExitButton />
    </main>
  );
}
