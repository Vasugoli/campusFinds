import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FAQ = () => {
  const faqs = [
    {
      question: "How do I report a lost item?",
      answer: "Click on 'Report Lost' in the navigation menu, fill out the form with detailed information about your lost item including description, location, and date. You can also upload a photo to help others identify your item."
    },
    {
      question: "What should I do if I find someone's item?",
      answer: "Use the 'Report Found' feature to submit details about the item you found. Provide as much information as possible including where and when you found it. This helps the rightful owner locate their item more easily."
    },
    {
      question: "How long are items kept in the system?",
      answer: "Items remain in our database for 90 days. After this period, unclaimed items may be donated or disposed of according to campus policy. We recommend checking regularly and claiming items as soon as possible."
    },
    {
      question: "How do I claim an item?",
      answer: "When you find your item on the platform, click on it to view details, then click the 'Claim Item' button. You'll need to verify your identity and provide proof of ownership. Our team will contact you to arrange the return."
    },
    {
      question: "Is my personal information safe?",
      answer: "Yes, we take privacy seriously. Your contact information is only shared with authorized personnel for the purpose of returning lost items. We never share your personal data with third parties."
    },
    {
      question: "Can I search for items by location?",
      answer: "Yes! Use the search bar and filters on the Browse page to narrow down items by location, category, date, and status (lost or found)."
    },
    {
      question: "What if my item isn't listed?",
      answer: "Keep checking back regularly as new items are reported daily. You can also contact our office directly or visit the campus lost and found center in person."
    },
    {
      question: "How do I contact support?",
      answer: "Visit our Contact page to send us a message, call our office, or visit us in person. We respond to all inquiries within 24 hours."
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 animate-fade-up">
            <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about CampusFinds
            </p>
          </div>

          <Card className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Common Questions</CardTitle>
              <CardDescription>
                Click on any question to expand and see the answer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left hover:text-primary transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-none animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <CardContent className="pt-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? Get in touch with our support team.
              </p>
              <Link to="/contact">
                <Button className="transition-all hover:scale-105">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
