import { AdminPageHeader } from '@/components/admin/DataTable';
import CitiesManager from '@/components/admin/CitiesManager';
import { getAllCities } from '@/lib/cities';

export default async function AdminCitiesPage() {
  const cities = await getAllCities();

  return (
    <div>
      <AdminPageHeader
        title="Cities"
        subtitle="Add a city to give it its own landing page, or remove ones you added."
        count={cities.length}
      />
      <CitiesManager cities={cities} />
    </div>
  );
}
