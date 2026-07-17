import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("nakopleniya");
export default function Page() {
  return <CalculatorPage slug="nakopleniya" />;
}
