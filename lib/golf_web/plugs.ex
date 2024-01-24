defmodule GolfWeb.Plugs do
  import Plug.Conn

  def unique_session_id() do
    :crypto.strong_rand_bytes(16)
    |> Base.encode16()
  end

  def put_session_id(conn, _opts) do
    case get_session(conn, :session_id) do
      nil ->
        session_id = unique_session_id()

        conn
        |> assign(:session_id, session_id)
        |> put_session(:session_id, session_id)

      session_id ->
        assign(conn, :session_id, session_id)
    end
  end

  def put_user(conn, _opts) do
    case Golf.Users.get_user_by_session_id(conn.assigns.session_id) do
      nil ->
        sess_id = conn.assigns.session_id

        username =
          "#{Golf.Users.default_username()}-#{String.slice(sess_id, 0..2) |> String.downcase()}"

        user_attrs = %{
          session_id: sess_id,
          name: username
        }

        {:ok, user} = Golf.Users.create_user(user_attrs)
        assign(conn, :user, user)

      user ->
        assign(conn, :user, user)
    end
  end
end
