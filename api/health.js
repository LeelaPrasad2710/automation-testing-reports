module.exports = (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() })
}
