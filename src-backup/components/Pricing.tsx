import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import Layout from './Layout';

interface PricingPlan {
  name: string;
  price: string | { monthly: string; annual: string; discount: string; original: string };
  popular: boolean;
  features: string[];
  button: {
    text: string;
    link: string;
  };
}

const Pricing: React.FC = () => {
  const pricing: PricingPlan[] = [
    {
      name: "Personal",
      price: "Free",
      popular: false,
      features: [
        "Lifetime free",
        "Up to 3 family members",
        "Basic email categorization",
        "Simple task extraction",
        "Basic calendar integration",
        "Community support",
      ],
      button: {
        text: "Get Started",
        link: ROUTES.DASHBOARD,
      },
    },
    {
      name: "Family",
      price: {
        monthly: "$19",
        annual: "$16",
        discount: "10%",
        original: "$24",
      },
      popular: true,
      features: [
        "All Free Features",
        "Up to 8 family members",
        "Advanced AI categorization",
        "Smart task prioritization",
        "Full calendar integration",
        "Email insights & analytics",
        "Priority support",
      ],
      button: {
        text: "Get Started",
        link: ROUTES.DASHBOARD,
      },
    },
    {
      name: "Enterprise",
      price: "Custom",
      popular: false,
      features: [
        "All Family Features",
        "Unlimited family members",
        "Custom AI training",
        "Advanced analytics dashboard",
        "SAML & SSO Integration",
        "Dedicated account manager",
        "24/7 phone support",
      ],
      button: {
        text: "Contact us",
        link: ROUTES.CONTACT,
      },
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold lg:tracking-tight">Pricing</h1>
        <p className="text-lg mt-4 text-slate-600">
          Simple & Predictable pricing. No Surprises.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-10 mx-auto max-w-5xl mt-12">
        {pricing.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col w-full border-2 ${
              plan.popular ? 'border-blue-500' : 'border-gray-200'
            } border-opacity-50 py-5 px-6 rounded-md relative`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 text-sm rounded-full">
                Most Popular
              </div>
            )}
            
            <div className="text-center">
              <h4 className="text-lg font-medium text-gray-400">{plan.name}</h4>
              <p className="mt-3 text-4xl font-bold text-black md:text-4xl">
                {typeof plan.price === 'object' ? plan.price.monthly : plan.price}
              </p>
              {typeof plan.price === 'object' && plan.price.original && (
                <p className="mt-1 text-xl font-medium text-gray-400 line-through md:text-2xl">
                  {plan.price.original}
                </p>
              )}
            </div>

            <ul className="grid mt-8 text-left gap-y-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-800">
                  <Check className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex mt-8">
              <Link
                to={plan.button.link}
                className={`w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {plan.button.text}
              </Link>
            </div>
          </div>
        ))}
      </div>
      </div>
    </Layout>
  );
};

export default Pricing;