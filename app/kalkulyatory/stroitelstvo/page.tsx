import CategoryPage, {
  createCategoryMetadata,
} from "../_components/CategoryPage";
const category = "stroitelstvo";
export const metadata = createCategoryMetadata(category);
export default function Page() {
  return <CategoryPage id={category} />;
}
