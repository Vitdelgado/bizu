-- Função para promover/demover usuários
CREATE OR REPLACE FUNCTION promote_demote_user(
    p_user_id UUID,
    p_new_role role_type,
    p_performed_by UUID
) RETURNS VOID AS $$
DECLARE
    admin_count INTEGER;
    current_role role_type;
BEGIN
    SELECT role INTO current_role FROM users WHERE id = p_user_id;
    IF current_role = 'admin' AND p_new_role != 'admin' THEN
        SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
        IF admin_count <= 1 THEN
            RAISE EXCEPTION 'Não é possível remover o último admin.';
        END IF;
    END IF;
    UPDATE users SET role = p_new_role, updated_at = NOW() WHERE id = p_user_id;
    INSERT INTO audit_logs (action, performed_by, target_user, details)
    VALUES ('promote_demote', p_performed_by, p_user_id, jsonb_build_object('new_role', p_new_role));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar edição de bizu
CREATE OR REPLACE FUNCTION log_bizu_edit(
    p_bizu_id UUID,
    p_editor_id UUID,
    p_changes JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO bizu_edits (bizu_id, editor_id, changes) VALUES (p_bizu_id, p_editor_id, p_changes);
    INSERT INTO audit_logs (action, performed_by, target_bizu, details)
    VALUES ('edit_bizu', p_editor_id, p_bizu_id, p_changes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 