import { AlignLeft, Scale, Languages as LangIcon } from 'lucide-react';
import { FormField, Textarea } from '@/components/ui';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import { LEGAL_SERVICE_NAMES } from '@/data/categories';
import { LANGUAGES } from '@/data/languages';
import DashboardSection from '../DashboardSection';

/**
 * SectionAboutServices — about text, legal services and languages.
 */
export default function SectionAboutServices({ data, set }) {
  return (
    <>
      <DashboardSection id="about" title="About" description="Tell clients about your practice and approach." icon={AlignLeft}>
        <FormField label="About You" htmlFor="d-about" hint={`${data.about.length} characters`}>
          <Textarea id="d-about" rows={6} value={data.about} onChange={(e) => set('about', e.target.value)} />
        </FormField>
      </DashboardSection>

      <DashboardSection id="services" title="Legal Services" description="Select the services you practise (up to 4)." icon={Scale}>
        <ChipMultiSelect options={LEGAL_SERVICE_NAMES} value={data.services} onChange={(v) => set('services', v)} max={4} />
      </DashboardSection>

      <DashboardSection id="languages" title="Languages" description="Languages you can consult in." icon={LangIcon}>
        <ChipMultiSelect options={LANGUAGES} value={data.languages} onChange={(v) => set('languages', v)} />
      </DashboardSection>
    </>
  );
}
