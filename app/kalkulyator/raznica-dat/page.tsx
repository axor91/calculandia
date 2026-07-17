import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("raznica-dat");
export default function Page() {
  return <CalculatorPage slug="raznica-dat" />;
}
