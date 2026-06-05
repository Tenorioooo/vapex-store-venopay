import Hero from '../components/home/Hero';
import PromoBanner from '../components/home/PromoBanner';
import Categories from '../components/home/Categories';
import FeaturedProducts from '../components/home/FeaturedProducts';
import Lifestyle from '../components/home/Lifestyle';
import Benefits from '../components/home/Benefits';

export default function HomePage() {
  return (
    <>
      <PromoBanner />
      <FeaturedProducts />
      <Categories />
      <Hero />
      <Lifestyle />
      <Benefits />
    </>
  );
}
