import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";
export const metadata = createCalculatorMetadata("procentnoe-izmenenie");
export default function Page() {
  return <CalculatorPage slug="procentnoe-izmenenie" />;
}
