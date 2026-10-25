def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_signup_login_me(client, user):
    r = client.get("/auth/me", headers=user.headers)
    assert r.status_code == 200
    assert r.json()["email"] == user.email


def test_duplicate_signup_is_rejected(client, user):
    r = client.post("/auth/signup", json={"email": user.email.upper(), "password": "password123"})
    assert r.status_code == 400


def test_wrong_password(client, user):
    r = client.post("/auth/login", data={"username": user.email, "password": "nope-nope-nope"})
    assert r.status_code == 401


def test_protected_route_needs_token(client):
    assert client.get("/expenses").status_code == 401


def test_forgot_password_does_not_reveal_accounts(client, sent_emails):
    r = client.post("/auth/forgot-password", json={"email": "nobody@test.com"})
    assert r.status_code == 200
    assert sent_emails == []


def test_reset_password_flow(client, user, sent_emails):
    assert client.post("/auth/forgot-password", json={"email": user.email}).status_code == 200
    ((to, link),) = sent_emails
    assert to == user.email
    token = link.split("token=")[1]

    r = client.post("/auth/reset-password", json={"token": token, "new_password": "brand-new-pass1"})
    assert r.status_code == 200

    # the link works only once
    r = client.post("/auth/reset-password", json={"token": token, "new_password": "another-pass12"})
    assert r.status_code == 400

    assert client.post("/auth/login", data={"username": user.email, "password": user.password}).status_code == 401
    assert client.post("/auth/login", data={"username": user.email, "password": "brand-new-pass1"}).status_code == 200


def test_only_newest_reset_link_works(client, user, sent_emails):
    client.post("/auth/forgot-password", json={"email": user.email})
    client.post("/auth/forgot-password", json={"email": user.email})
    old, new = (link.split("token=")[1] for _, link in sent_emails)
    assert client.post("/auth/reset-password", json={"token": old, "new_password": "brand-new-pass1"}).status_code == 400
    assert client.post("/auth/reset-password", json={"token": new, "new_password": "brand-new-pass1"}).status_code == 200


def test_bad_reset_token(client):
    r = client.post("/auth/reset-password", json={"token": "x" * 43, "new_password": "brand-new-pass1"})
    assert r.status_code == 400
