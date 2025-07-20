-- =====================================================
-- 02 - TRIGGERS E FUNÇÕES (SEGUNDO A EXECUTAR)
-- =====================================================

-- Função para criar perfil na tabela users ao inserir em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role, created_at)
  VALUES (NEW.id, NEW.email, NULL, NULL, 'suporte', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para rodar a função após inserir em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar contador de likes
CREATE OR REPLACE FUNCTION update_bizu_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE bizus SET likes = likes + 1 WHERE id = NEW.bizu_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE bizus SET likes = likes - 1 WHERE id = OLD.bizu_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de likes
DROP TRIGGER IF EXISTS trigger_update_bizu_likes_count ON bizu_likes;
CREATE TRIGGER trigger_update_bizu_likes_count
    AFTER INSERT OR DELETE ON bizu_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_bizu_likes_count();

-- Função para verificar se usuário curtiu um bizu
CREATE OR REPLACE FUNCTION has_user_liked_bizu(bizu_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM bizu_likes 
        WHERE bizu_id = bizu_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter top bizus por likes
CREATE OR REPLACE FUNCTION get_top_bizus_by_likes(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title TEXT,
    category TEXT,
    keywords TEXT[],
    content TEXT,
    image_url TEXT,
    author_id UUID,
    likes INTEGER,
    views INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.category,
        b.keywords,
        b.content,
        b.image_url,
        b.author_id,
        b.likes,
        b.views,
        b.created_at,
        b.updated_at
    FROM bizus b
    ORDER BY b.likes DESC, b.views DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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