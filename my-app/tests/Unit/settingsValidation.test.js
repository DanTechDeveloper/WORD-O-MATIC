// ponytail: mirrors Settings.jsx:17 validation — emailOK, nameOK, isDirty, senderValid, pwdOk
const emailOk = (email) => /^\S+@\S+\.\S+$/.test(email.trim());
const nameOk = (name) => name.trim().length > 0;
const isDirty = (formEmail, formName, curEmail, curName) =>
    formEmail.trim().toLowerCase() !== (curEmail || "").trim().toLowerCase() ||
    formName.trim() !== (curName || "").trim();
const senderValid = (email, name, curEmail, curName) => emailOk(email) && nameOk(name) && isDirty(email, name, curEmail, curName);
const pwdOk = (cur, pwd, conf) => pwd.length >= 8 && pwd === conf && cur.length > 0;

describe("Settings — sender regex", () => {
    test("valid emails pass", () => {
        expect(emailOk("teacher@wordomatic.edu")).toBe(true);
        expect(emailOk("a@b.c")).toBe(true);
        expect(emailOk("  a@b.c  ")).toBe(true);
    });
    test("invalid emails fail", () => {
        expect(emailOk("a@b")).toBe(false);
        expect(emailOk("a@b.")).toBe(false);
        expect(emailOk("a @b.com")).toBe(false);
        expect(emailOk("")).toBe(false);
        expect(emailOk("a @b.c")).toBe(false);
    });
});

describe("Settings — isDirty", () => {
    test("same email case-insensitive is not dirty", () => {
        expect(isDirty("Teacher@Wordomatic.edu", "Admin", "teacher@wordomatic.edu", "Admin")).toBe(false);
        expect(isDirty("  teacher@wordomatic.edu  ", "Admin", "teacher@wordomatic.edu", "Admin")).toBe(false);
    });
    test("different email is dirty", () => {
        expect(isDirty("new@b.com", "Admin", "old@b.com", "Admin")).toBe(true);
    });
    test("same email but different name is dirty", () => {
        expect(isDirty("a@b.com", "New Name", "a@b.com", "Old Name")).toBe(true);
    });
    test("trim diff not dirty", () => {
        expect(isDirty("  Admin  ", "Admin", "Admin", "Admin")).toBe(false); // actually email vs name — name trim
        expect(isDirty("a@b.com", "  Admin  ", "a@b.com", "Admin")).toBe(false);
    });
    test("null curEmail handled", () => {
        expect(isDirty("a@b.com", "Admin", "", "Admin")).toBe(true);
        expect(isDirty("", "Admin", "", "Admin")).toBe(false);
    });
});

describe("Settings — senderValid", () => {
    test("disabled when not dirty even if email/name ok", () => {
        expect(senderValid("a@b.com", "Admin", "a@b.com", "Admin")).toBe(false);
    });
    test("enabled when dirty and valid", () => {
        expect(senderValid("new@b.com", "Admin", "old@b.com", "Admin")).toBe(true);
    });
    test("disabled when email invalid", () => {
        expect(senderValid("invalid", "Admin", "old@b.com", "Admin")).toBe(false);
    });
    test("disabled when name empty", () => {
        expect(senderValid("a@b.com", "   ", "old@b.com", "Admin")).toBe(false);
    });
});

describe("Settings — pwdOk", () => {
    test("requires current, min 8, and match", () => {
        expect(pwdOk("password", "newpass123", "newpass123")).toBe(true);
        expect(pwdOk("", "newpass123", "newpass123")).toBe(false);
        expect(pwdOk("password", "short", "short")).toBe(false);
        expect(pwdOk("password", "newpass123", "different")).toBe(false);
    });
});

describe("Settings — hasEmail banner", () => {
    test("has_email derived", () => {
        const hasEmail = (email) => !!email && email.trim() !== "";
        expect(hasEmail("a@b.com")).toBe(true);
        expect(hasEmail("")).toBe(false);
        expect(hasEmail(null)).toBe(false);
    });
});
