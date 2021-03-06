const knex = require("../conexao");
const bcrypt = require("bcrypt");
const validarLogin = require("../validacoes/validacaoLoginUsuario");
const jwt = require("jsonwebtoken");

async function loginUsuario(req, res) {
  const { email, senha } = req.body;

  try {
    const erroValidacaoLogin = validarLogin(email, senha);

    if (erroValidacaoLogin) {
      return res.status(400).json(erroValidacaoLogin);
    }

    const usuario = await knex("usuario")
      .where("email", "ilike", email)
      .first();

    if (!usuario) {
      return res.status(404).json("O usuario não foi encontrado");
    }

    const restaurante = await knex("restaurante")
      .join("categoria", "categoria_id", "categoria.id")
      .select(
        "restaurante.*",
        "categoria.nome as nomeCategoria",
        "categoria.imagem as imagemCategoria"
      )
      .where({ usuario_id: usuario.id })
      .first();

    if (!restaurante) {
      return res.status(404).json("O restaurante não foi encontrado");
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(400).json("Email e senha não confere");
    }

    const token = jwt.sign({ id: usuario.id }, process.env.SENHA_HASH);

    const { senha: _, ...dadosUsuario } = usuario;

    return res.status(200).json({ usuario: dadosUsuario, restaurante, token });
  } catch (error) {
    return res.status(400).json(error.message);
  }
}

module.exports = { loginUsuario };
