module.exports = (req, res, next) => {
    res.header('Content-type', 'application/json');
    next();
}