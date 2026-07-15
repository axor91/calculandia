import CalculatorPage, {
  createCalculatorMetadata,
} from "../_components/CalculatorPage";

const slug = "mortgage";

export const metadata = createCalculatorMetadata(slug);

export default function Page() {
  return <CalculatorPage slug={slug} />;
}
