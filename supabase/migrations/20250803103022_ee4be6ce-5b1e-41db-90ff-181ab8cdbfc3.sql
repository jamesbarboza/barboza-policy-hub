-- Create/find an admin user and use their ID for policy creation
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Try to find an existing admin user
    SELECT ur.user_id INTO admin_user_id
    FROM user_roles ur
    WHERE ur.role = 'admin'
    LIMIT 1;
    
    -- If no admin user exists, we'll use a placeholder UUID for seed data
    -- In a real scenario, you'd want to ensure an admin user exists first
    IF admin_user_id IS NULL THEN
        admin_user_id := '00000000-0000-0000-0000-000000000001';
    END IF;
    
    -- Insert sample policies with the admin user as creator
    INSERT INTO public.policies (name, description, coverage_amount, premium_amount, duration_months, status, created_by) VALUES
    ('Basic Life Insurance', 'Affordable life insurance coverage for individuals and families. Provides financial protection for your loved ones.', 50000, 89.99, 12, 'active', admin_user_id),
    ('Premium Life Insurance', 'Comprehensive life insurance with enhanced benefits and higher coverage limits. Ideal for families with substantial financial obligations.', 250000, 299.99, 24, 'active', admin_user_id),
    ('Auto Insurance Standard', 'Complete auto insurance coverage including liability, collision, and comprehensive protection for your vehicle.', 25000, 125.50, 12, 'active', admin_user_id),
    ('Home Insurance Plus', 'Comprehensive home insurance covering dwelling, personal property, and liability protection for homeowners.', 150000, 185.75, 12, 'active', admin_user_id),
    ('Health Insurance Basic', 'Essential health insurance coverage with preventive care, emergency services, and prescription drug benefits.', 75000, 215.00, 12, 'active', admin_user_id),
    ('Travel Insurance', 'Short-term travel insurance for domestic and international trips. Covers medical emergencies, trip cancellation, and lost luggage.', 10000, 45.25, 6, 'active', admin_user_id),
    ('Business Liability', 'Professional liability insurance for small businesses and entrepreneurs. Protects against claims of negligence and errors.', 500000, 425.00, 12, 'active', admin_user_id),
    ('Pet Insurance', 'Veterinary care coverage for dogs and cats. Includes accidents, illnesses, and routine preventive care options.', 15000, 67.99, 12, 'active', admin_user_id),
    ('Disability Insurance', 'Income protection insurance that provides financial support if you become unable to work due to illness or injury.', 100000, 175.50, 36, 'active', admin_user_id),
    ('Umbrella Insurance', 'Additional liability coverage that extends beyond your existing auto and home insurance policies for extra protection.', 1000000, 195.00, 12, 'inactive', admin_user_id);
END $$;