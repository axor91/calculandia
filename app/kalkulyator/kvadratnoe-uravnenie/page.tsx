import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("kvadratnoe-uravnenie");
export default function Page() {
  return <CalculatorPage slug="kvadratnoe-uravnenie" />;
}
