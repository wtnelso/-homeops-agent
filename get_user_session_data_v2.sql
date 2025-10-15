-- RPC function to get comprehensive user session data
-- This avoids RLS recursion issues and gets all needed data in one call

CREATE OR REPLACE FUNCTION get_user_session_data(auth_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    user_record record;
BEGIN
    -- Get the user data with family info via FK
    SELECT u.*, f.name as family_name, f.family_type
    INTO user_record
    FROM public.users u
    LEFT JOIN public.families f ON f.id = u.family_id
    WHERE u.auth_id = auth_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'User not found', 'user', null, 'family', null);
    END IF;

    -- Build the comprehensive result
    SELECT json_build_object(
        'user', json_build_object(
            'id', user_record.id,
            'email', user_record.email,
            'name_user_provided', user_record.name_user_provided,
            'name_auth_provided', user_record.name_auth_provided,
            'avatar_url', user_record.avatar_url,
            'avatar_user_provided', user_record.avatar_user_provided,
            'role', user_record.role,
            'is_active', user_record.is_active,
            'email_verified', user_record.email_verified,
            'last_login_at', user_record.last_login_at,
            'created_at', user_record.created_at,
            'family_id', user_record.family_id,
            'agent_name', user_record.agent_name,
            'account_name', user_record.account_name,
            'timezone', user_record.timezone,
            'family_relationship', COALESCE(
                (SELECT fm.family_relationship
                 FROM public.family_members fm
                 WHERE fm.user_id = user_record.id
                 AND fm.family_id = user_record.family_id),
                'self'
            ),
            'activities', COALESCE(
                (SELECT json_agg(
                    json_build_object(
                        'id', a.id,
                        'activity_name', a.activity_name,
                        'activity_type', a.activity_type,
                        'frequency', a.frequency
                    )
                )
                FROM family.activities a
                JOIN public.family_members fm ON fm.id = a.family_member_id
                WHERE fm.user_id = user_record.id
                AND fm.family_id = user_record.family_id
                ), '[]'::json
            ),
            'schools', COALESCE(
                (SELECT json_agg(
                    json_build_object(
                        'id', s.id,
                        'school_name', s.school_name,
                        'school_type', s.school_type,
                        'grade', s.grade
                    )
                )
                FROM family.schools s
                JOIN public.family_members fm ON fm.id = s.family_member_id
                WHERE fm.user_id = user_record.id
                AND fm.family_id = user_record.family_id
                ), '[]'::json
            )
        ),
        'family', CASE
            WHEN user_record.family_id IS NOT NULL THEN
                json_build_object(
                    'id', user_record.family_id,
                    'name', user_record.family_name,
                    'family_type', user_record.family_type,
                    'contacts', COALESCE(
                        (SELECT json_agg(
                            json_build_object(
                                'id', c.id,
                                'name', c.contact_name,
                                'contact_type', c.contact_type,
                                'phone', c.phone,
                                'email', c.email
                            )
                        )
                        FROM family.contacts c
                        WHERE c.family_id = user_record.family_id
                        ), '[]'::json
                    ),
                    'keywords', '[]'::json,
                    'members', COALESCE(
                        (SELECT json_agg(
                            json_build_object(
                                'user_id', u.id,
                                'email', u.email,
                                'name_user_provided', u.name_user_provided,
                                'name_auth_provided', u.name_auth_provided,
                                'role', u.role,
                                'is_active', u.is_active,
                                'email_verified', u.email_verified,
                                'created_at', u.created_at,
                                'family_relationship', fm.family_relationship,
                                'activities', COALESCE(
                                    (SELECT json_agg(
                                        json_build_object(
                                            'id', a.id,
                                            'activity_name', a.activity_name,
                                            'activity_type', a.activity_type,
                                            'frequency', a.frequency
                                        )
                                    )
                                    FROM family.activities a
                                    WHERE a.family_member_id = fm.id
                                    ), '[]'::json
                                ),
                                'schools', COALESCE(
                                    (SELECT json_agg(
                                        json_build_object(
                                            'id', s.id,
                                            'school_name', s.school_name,
                                            'school_type', s.school_type,
                                            'grade', s.grade
                                        )
                                    )
                                    FROM family.schools s
                                    WHERE s.family_member_id = fm.id
                                    ), '[]'::json
                                )
                            )
                        )
                        FROM public.family_members fm
                        JOIN public.users u ON u.id = fm.user_id
                        WHERE fm.family_id = user_record.family_id
                        AND u.is_active = true
                        AND u.id != user_record.id
                        ), '[]'::json
                    )
                )
            ELSE null
        END,
        'user_integrations', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', ui.id,
                    'integration_id', ui.integration_id,
                    'status', ui.status
                )
            )
            FROM public.user_integrations ui
            WHERE ui.user_id = user_record.id
            ), '[]'::json
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_session_data(uuid) TO authenticated;