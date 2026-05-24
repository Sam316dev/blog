export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const API_KEY     = process.env.MAILCHIMP_API_KEY;
    const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
    const DC          = API_KEY.split("-")[1];

    const response = await fetch(
        `https://${DC}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
        {
            method: "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Basic ${btoa(`anystring:${API_KEY}`)}`
            },
            body: JSON.stringify({
                email_address: email,
                status:        "subscribed"
            })
        }
    );

    const data = await response.json();

    if (response.ok) return res.status(200).json({ success: true });
    if (data.title === "Member Exists") return res.status(200).json({ success: true });

    return res.status(400).json({ error: data.detail || "Something went wrong" });
}
