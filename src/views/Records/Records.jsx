import React, { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Petition, keySecret, copyData, setTittleDOM, WithDecimals } from "../../utils/constanst"

// Import middlewares and validators
import jwt from "jwt-simple"
import moment from "moment"
import Validator from "validator"

// Import styles and assets
import "./Records.scss"
import Astronaut from '../../static/images/astronaut.png'
import sounNotification from "../../static/sound/notification.mp3"

// Import components
import ActivityIndicator from "../../components/ActivityIndicator/Activityindicator"
import Modal from "../../components/Modal/Modal"
import NavigationBar from "../../components/NavigationBar/NavigationBar"
import Swal from "sweetalert2"

const Records = () => {
    const { token } = useSelector((storage) => storage.globalStorage)
    const socket = useSelector(storage => storage.socket)

    // Estado que guarda las tabs activas de solicitudes
    const [tab, setTab] = useState(1)

    // Estado que guarda el texto para filtrar en la coleccion de solicitudes y registros
    const [filter, setFilter] = useState('')

    // Estado que guarda la coleccion para renderizar las listas de registros y solicitudes
    const [allUpgrades, setUpgrades] = useState([])
    const [allRequest, setRequests] = useState([])
    const [allRecord, setRecords] = useState([])
    const [allExchange, setExchange] = useState([])
    const [allMoneyChanger, setMoneyChanger] = useState([])

    // Estado que guarda el detalle de los registros
    const [dataRequest, setDataRequest] = useState({})
    const [dataUpgrade, setDataUpgrade] = useState({})
    const [dataRecord, setDataRecord] = useState({})

    // Estados que manejan el renderizado de las ventanas modales
    // para ver los detalles de cada registro:
    const [showRequest, setShowRequest] = useState(false)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [showRecord, setShowRecord] = useState(false)

    // Estado para renderizar los preloader/loader al hacer una peticion
    const [loader, setLoader] = useState(true)
    const [loaderPetition, setLoaderPetition] = useState(false)
    const [loaderTrading, setLoaderTrading] = useState(false)

    // Estados para los componentes de ejecutar trading
    const [percentage, setPercentage] = useState('')
    const [cryptoCurrency, setCrypto] = useState('default')

    // Estado que guarda la configuracion diaria del trading
    const [dataTrading, setDataTrading] = useState({ crypto: [], day: 0 })

    // Estado que guarda el hash de transaccion al sponsor_email
    // Cuando un usuario hace una solicitud de inversion
    const [hashForSponsor, setHashForSponsor] = useState("")

    // Estado que guarda el indice de
    // los datos especificos y mostrarlos como detalles
    const [showExchangeRequest, setExchangeRequestModal] = useState(false)

    // Estado que guarda el indice de
    // los datos especificos y mostrarlos como detalles de compra y venta
    const [showMoneyChagerRequest, setMoneyChagerRequestModal] = useState(false)

    // Estado que guarda la solcitud exchange especifca
    const [detailsRequestExchange, setDetailsExchange] = useState({})

    // Estado que guarda la solcitud compora y venta (Money Changer)
    const [detailsRequestMoneyChanger, setDetailsMoneyChanger] = useState({})

    // Estado que contiene el hash de pago en exchange
    const [hashExchangeRequest, setHashExchangeRequest] = useState("")

    // Estado que contiene el hash de pago en Compra (Money Changer)
    const [hashMonyeChangerRequest, setHashMonyeChangerRequest] = useState("")

    // Estado que muestra la ventana de confirmacion de rechazo
    const [declineConfirm, setDeclineConfirm] = useState(false)

    // Estado que guarda la razon del rechazo de intercambio exchange
    const [reasonDecline, setReasonDecline] = useState("")

    // Estado que indica si envia notificacion al correo del rechazo de solicitud en Money Changer
    const [checkSendNotification, setCheckSendNotification] = useState(true)

    // Obtiene todas las solicitudes `allExchange` para obtener
    const getAllRequest = () => {
        Petition.get('/admin/request/', {
            headers: {
                "x-auth-token": token
            }
        }).then(({ data }) => {
            if (data.error) {
                Swal.fire('Ha ocurrido un error', data.message, 'error')
            } else {
                setRequests(data)
            }
        })
    }

    // Obtiene todos los registros
    const getAllRecords = () => {
        Petition.get('/admin/records/', {
            headers: {
                "x-auth-token": token
            }
        }).then(({ data }) => {
            if (data.error) {
                Swal.fire('Ha ocurrido un error', data.message, 'error')
            } else {
                setRecords(data)
            }
        })
    }

    // Obtiene todas las solicitudes de Upgrades
    const getAllUpgrades = () => {
        Petition.get('/admin/upgrades', {
            headers: {
                "x-auth-token": token
            }
        }).then(({ data }) => {
            if (data.error) {
                Swal.fire('Ha ocurrido un error', data.message, 'error')
            } else {
                setUpgrades(data)
            }
        })
    }

    // Obtiene todas las solcitudes de intercambio exchange
    const getAllExchange = () => {
        Petition.get('/exchange', {
            headers: {
                "x-auth-token": token
            }
        }).then(({ data }) => {
            if (data.error) {
                Swal.fire('Ha ocurrido un error', data.message, 'error')
            } else {
                setExchange(data)
            }
        })
    }

    // Obtiene todas las solcitudes de compra y venta en Money Changer
    const getAllMoneyChanger = () => {
        Petition.get('/money-changer', {
            headers: {
                "x-auth-token": token
            }
        }).then(({ data }) => {
            if (data.error) {
                Swal.fire('Ha ocurrido un error', data.message, 'error')
            } else {
                setMoneyChanger(data)
            }
        })
    }

    // Ejecuta peticiones al servidor para obtener todos los datos de las tablas
    const ConfigurateComponent = async () => {
        setLoader(true)
        try {
            await getAllRequest()

            await getAllRecords()

            await getAllUpgrades()

            await getAllExchange()

            await getAllMoneyChanger()

            if (socket !== null) {
                const audioNotification = new Audio(sounNotification)

                socket.addEventListener("message", async (response) => {
                    const { data: typeEvent } = response

                    // esperamos respuesta de una nueva solicitud atravez del socket
                    if (typeEvent === "newRequest") {
                        await getAllRequest()
                    }

                    // Esperamos una nueva solictud de upgrade
                    if (typeEvent === "newUpgrade") {
                        await getAllUpgrades()
                    }

                    // Esperamos una nueva solictud de Exchange
                    if (typeEvent === "newExchange") {
                        await getAllExchange()
                    }

                    // Esperamos una nueva solictud de Exchange
                    if (typeEvent === "newMoneyChanger") {
                        await getAllMoneyChanger()
                    }

                    await window.focus()

                    audioNotification.muted = false

                    audioNotification.play()
                })
            }

        } catch (error) {
            Swal.fire('Ha ocurrido un error', error.toString(), 'error')
        } finally {
            setLoader(false)
        }

    }

    // Comprueba el trading del dia de hoy
    const configurateTrading = async () => {
        const _data = localStorage.getItem('@trading')

        if (_data) {
            const jsonTrading = jwt.decode(_data, keySecret)

            if (jsonTrading.day !== moment().get('day')) {
                localStorage.removeItem('@trading')

                setDataTrading({ crypto: [], day: 0 })
            } else {
                setDataTrading(jsonTrading)
            }
        }
    }

    // Componente que representa un articulo de la lista
    // de solicitudes de registro
    const itemRequest = (item, index) => {
        if (
            item.name.length > 0 && item.name.toLowerCase().search(filter) > -1 ||
            item.amount.length > 0 && item.amount.toLowerCase().search(filter) > -1 ||
            item.sponsor_email !== null && item.sponsor_email.toLowerCase().search(filter) > -1
        ) {
            return (
                <div className="row" key={index} onClick={_ => openDetailsRequest(item.id)}>
                    <span className="name">{item.name}</span>
                    <span>{item.amount} {item.id_currency === 1 && 'BTC'} {item.id_currency === 2 && 'ETH'}</span>
                    <span>
                        {
                            item.sponsor_email !== null
                                ? item.sponsor_email
                                : <i>Sin sponsor</i>
                        }
                    </span>
                </div>
            )
        }
    }

    // Componente que representa un articulo de la lista
    // de solicitudes de Upgrade
    const itemUpgrade = (item, index) => {
        if (
            item.name.length > 0 && item.name.toLowerCase().search(filter) > -1 ||
            item.amount.length > 0 && item.amount.toLowerCase().search(filter) > -1 ||
            item.sponsor_email !== null && item.sponsor_email.toLowerCase().search(filter) > -1
        ) {
            return (
                <div className="row" key={index} onClick={_ => openDetailsUpgrade(item.id)}>
                    <span className="name">{item.name}</span>
                    <span>{item.amount} {item.id_currency === 1 && 'BTC'} {item.id_currency === 2 && 'ETH'}</span>
                    <span>
                        {
                            item.sponsor_email !== null
                                ? item.sponsor_email
                                : <i>Sin sponsor</i>
                        }
                    </span>
                </div>
            )
        }
    }

    // Componente que representa un articulo de la lista
    // Registos
    const itemRecord = (item, index) => {
        if (
            item.name.length > 0 && item.name.toLowerCase().search(filter) > -1 ||
            item.country.length > 0 && item.country.toLowerCase().search(filter) > -1
            // allRecord.id_user
        ) {
            return (
                <div className="row" key={index} onClick={e => openDetailsRecord(item.id_user)}>
                    <span>{moment(item.start_date).format('MMM. D, YYYY')}</span>
                    <span className="name">{item.name}</span>
                    <span>{item.country}</span>
                    <span>
                        {
                            item.sponsor_email !== null
                                ? item.sponsor_email
                                : <i>Sin sponsor</i>
                        }
                    </span>
                </div>
            )
        }
    }

    // Componente que representa un articulo de la lista Exchange request
    const itemExchnage = (item, index) => {
        // Compra -- Venta -- Cantidad -- tiempo

        return (
            <div className="row" key={index} onClick={_ => openExchangeRequest(index)}>
                <span>{item.request_currency}</span>
                <span>{item.currency}</span>
                <span>{item.amount}</span>
                <span>{moment(item.date).fromNow()}</span>
            </div>
        )
    }

    // Componente que representa un articulo de la lista Exchange request
    const itemMoneyChanger = (item, index) => {
        // Tipo - Moneda - Monto - Solicitado

        return (
            <div className="row" key={index} onClick={_ => openMoneyChangerRequest(index)}>
                {
                    item.type === "buy" &&
                    <span>Compra</span>
                }

                {
                    item.type === "sell" &&
                    <span>Venta</span>
                }

                {
                    (item.type !== "sell" && item.type !== "buy") &&
                    <span>No identificado</span>
                }

                <span>{item.coin_name}</span>
                <span>$ {item.amount_usd}</span>
                <span>{moment(item.date).fromNow()}</span>
            </div>
        )
    }

    // Funcion que abre detalles al hacer la peticion de
    // detalles de solitud
    const openDetailsRequest = async (id = 0) => {
        // Open modal
        setShowRequest(true)

        try {
            // Show loader
            setLoaderPetition(true)

            // get data for petition
            await Petition.post('/admin/request/id', { id }, {
                headers: {
                    "x-auth-token": token
                }
            })
                .then(({ data }) => {
                    if (data.error) {
                        throw data.message
                    } else {
                        setDataRequest(data)
                    }
                })
        } catch (error) {
            Swal.fire('Ha ocurrido un error', error.toString(), 'error')
            setShowRequest(false)
        } finally {
            setLoaderPetition(false)
        }
    }

    // Funcion que abre detalles al hacer la peticion de
    // detalles de solitud upgrade
    const openDetailsUpgrade = async (id = 0) => {
        // Open modal
        setShowUpgrade(true)

        try {
            // Show loader
            setLoaderPetition(true)

            // get data for petition
            await Petition.post('/admin/upgrades/id', { id }, {
                headers: {
                    "x-auth-token": token
                }
            })
                .then(({ data }) => {
                    if (data.error) {
                        throw data.message
                    } else {
                        setDataUpgrade(data)
                    }
                })
        } catch (error) {
            Swal.fire('Ha ocurrido un error', error.toString(), 'error')
            setShowUpgrade(false)
        } finally {
            setLoaderPetition(false)
        }
    }

    // Funciion que abre ventana de detalles de registros aceptados
    // Ejecuta una peticion para obtener los datos por id
    const openDetailsRecord = async (id = 0) => {
        // Open modal
        setShowRecord(true)

        try {
            // Show loader
            setLoaderPetition(true)

            // get data for petition
            await Petition.post('/admin/records/id', { id }, {
                headers: {
                    "x-auth-token": token
                }
            })
                .then(({ data }) => {
                    if (data.error) {
                        throw data.message
                    } else {
                        setDataRecord(data)
                    }
                })
        } catch (error) {
            Swal.fire('Ha ocurrido un error', error.toString(), 'error')
            setShowRecord(false)
        } finally {
            setLoaderPetition(false)
        }
    }

    // Funcion que abre ventana modal con detalles de solicitud exchange
    const openExchangeRequest = async (index = 0) => {
        await setDetailsExchange(allExchange[index])

        setExchangeRequestModal(true)
    }

    // Funcion que abre ventana modal con detalles de solicitud exchange
    const openMoneyChangerRequest = async (index = 0) => {
        await setDetailsMoneyChanger(allMoneyChanger[index])

        setMoneyChagerRequestModal(true)
    }

    // Abre modal para confirmar rechazo de solicitud de registro
    const confirmDecline = (id = 0) => {
        Swal.fire({
            title: 'Rechazar',
            text: "¿Esta seguro que quiere ejecutar esta Accion? No se podra revertir",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Si, Rechazar!'
        }).then(async (result) => {
            if (result.value) {
                setLoaderPetition(true)

                await Petition.delete('/admin/request/decline', {
                    data: { id },
                    headers: {
                        "x-auth-token": token
                    }
                }).then(({ status, data }) => {
                    if (data.error) {
                        Swal.fire('Se ha producido un error', data.message, 'error')
                    } else {
                        if (status === 200) {
                            setShowRequest(false)

                            Swal.fire({
                                position: 'top-end',
                                icon: 'success',
                                title: 'Solicitud Rechazada',
                                showConfirmButton: false,
                                timer: 1500
                            })

                            ConfigurateComponent()
                        } else {
                            Swal.fire({
                                position: 'top-end',
                                icon: 'error',
                                title: 'Se ha producido un error',
                                showConfirmButton: false,
                                timer: 1500
                            })
                        }
                    }

                }).catch(reason => {
                    Swal.fire('Se ha producido un error', reason.toString(), 'error')
                })


                setLoaderPetition(false)
            }
        })
    }

    // Metodo que se ejecuta cuando se rechaza una solicitudde UPGRADE
    const confirmDeclineUpgrade = (id = 0) => {
        Swal.fire({
            title: 'Rechazar',
            text: "¿Esta seguro que quiere ejecutar esta Accion? No se podra revertir",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Si, Rechazar!'
        }).then(async (result) => {
            if (result.value) {
                setLoaderPetition(true)

                await Petition.delete('/admin/upgrades/decline', {
                    data: { id },
                    headers: {
                        "x-auth-token": token
                    }
                }).then(({ status, data }) => {
                    if (data.error) {
                        Swal.fire('Se ha producido un error', data.message, 'error')
                    } else {
                        if (status === 200) {
                            setShowUpgrade(false)

                            Swal.fire({
                                position: 'top-end',
                                icon: 'success',
                                title: 'Upgrade Rechazada',
                                showConfirmButton: false,
                                timer: 1500
                            })

                            ConfigurateComponent()
                        } else {
                            Swal.fire({
                                position: 'top-end',
                                icon: 'error',
                                title: 'Se ha producido un error',
                                showConfirmButton: false,
                                timer: 1500
                            })
                        }
                    }

                }).catch(reason => {
                    Swal.fire('Se ha producido un error', reason.toString(), 'error')
                })


                setLoaderPetition(false)
            }
        })
    }

    // Abre modal para confirmar rechazo de solicitud de registro
    const AcceptRequest = async (dataRequestItem = {}) => {
        setLoaderPetition(true)

        try {
            if (dataRequestItem.sponsor_username !== null && hashForSponsor.length === 0) {
                throw new Error("El hash de transaccion a sponsor es requerido")
            }

            await Petition.post('/admin/request/accept', { data: dataRequestItem, hashSponsor: hashForSponsor }, {
                headers: {
                    "x-auth-token": token
                }
            }).then(({ status, data }) => {
                if (data.error) {
                    Swal.fire('Se ha producido un error', data.message, 'error')
                } else {
                    if (status === 200) {
                        setShowRequest(false)

                        Swal.fire({
                            position: 'top-end',
                            icon: 'success',
                            title: 'Solicitud Aceptada',
                            showConfirmButton: false,
                            timer: 1500
                        })

                        ConfigurateComponent()
                    } else {
                        Swal.fire({
                            position: 'top-end',
                            icon: 'error',
                            title: 'Se ha producido un error',
                            showConfirmButton: false,
                            timer: 1500
                        })
                    }
                }

            }).catch(reason => {
                Swal.fire('Se ha producido un error', reason.toString(), 'error')
            })

        } catch (error) {
            Swal.fire("Ha ocurrido un error", error.toString(), "warning")
        }


        setLoaderPetition(false)
    }

    // Abre modal para confirmar solicitud de Upgrade
    const AcceptUpgrade = async (dataUpgrade) => {
        setLoaderPetition(true)
        try {
            if (dataUpgrade.sponsor_username !== null && hashForSponsor.length === 0) {
                throw new Error("El hash de transaccion a sponsor es requerido")
            }

            await Petition.post('/admin/upgrades/accept', { data: dataUpgrade, hashSponsor: hashForSponsor }, {
                headers: {
                    "x-auth-token": token
                }
            }).then(({ status, data }) => {
                if (data.error) {
                    Swal.fire('Se ha producido un error', data.message, 'error')
                } else {
                    if (status === 200) {
                        setShowUpgrade(false)

                        Swal.fire({
                            position: 'top-end',
                            icon: 'success',
                            title: 'Solicitud Aceptada',
                            showConfirmButton: false,
                            timer: 1500
                        })

                        ConfigurateComponent()
                    } else {
                        Swal.fire({
                            position: 'top-end',
                            icon: 'error',
                            title: 'Se ha producido un error',
                            showConfirmButton: false,
                            timer: 1500
                        })
                    }
                }

            }).catch(reason => {
                Swal.fire('Ha ocurrido un error', reason.toString(), 'error')
            })
        } catch (error) {
            Swal.fire("Ha ocurrido un error", error.toString(), "warning")
        } finally {
            setLoaderPetition(false)
        }
    }

    // Metodo que acepta la solicitud de Money Changer
    const acceptMoneyChanger = async () => {
        try {
            setLoaderPetition(true)

            // Validamos la compra si existe un hash de transaccion
            if (detailsRequestMoneyChanger.type === "buy") {
                if (hashMonyeChangerRequest.length < 8) {
                    throw "Hash de transacción es incorrecto"
                }
            } else if (detailsRequestMoneyChanger.type === "sell") {
                // Validamos la venta con un ID de manipulacion
                if (hashMonyeChangerRequest.length < 8) {
                    throw "ID de manipulación es incorrecto"
                }
            } else {
                // Si el detalle no es de venta ni de compra
                // Alertamos al usuario
                throw "Detalles de compra no definido, contacte a Samuel"
            }

            const data = {
                ...detailsRequestMoneyChanger,
                hash: hashMonyeChangerRequest
            }

            await Petition.post("/money-changer/accept", { data }, { headers: { "x-auth-token": token } })
                .then(response => {
                    const { data } = response

                    if (data.error) {
                        // Verificamos si el server retorna un error
                        throw data.message
                    } else if (data.response === "success") {
                        // Verificamos que el servidor retorne la confirmacion
                        setHashMonyeChangerRequest("")
                        setMoneyChagerRequestModal(false)

                        Swal.fire({
                            position: 'top-end',
                            icon: 'success',
                            title: 'Solicitud Procesada',
                            showConfirmButton: false,
                            timer: 1500
                        })

                        getAllMoneyChanger()

                    } else {
                        // Si el servidor no devuelve una respuesta valida
                        throw "La solicitud no pudo completarse, contacte a Samuel"
                    }
                })
                .catch(reason => {
                    throw reason
                })


        } catch (reason) {
            Swal.fire('Ha ocurrido un error', reason.toString(), 'error')
        } finally {
            setLoaderPetition(false)
        }
    }

    // Metodo para aplicar trading
    const applyTrading = async () => {
        try {
            setLoaderTrading(true)

            if (!Validator.isNumeric(percentage)) {
                throw new Error("El porcentaje del trading no es valido")
            }

            if (cryptoCurrency === "default") {
                throw new Error("Seleccione una moneda")
            }

            // Verificamos si el trading en esa moneda ya se hizo
            if (!dataTrading.crypto.includes(cryptoCurrency)) {

                const dataSend = { percentage, id_currency: Number(cryptoCurrency) }

                await Petition.post('/admin/trading', dataSend, {
                    headers: {
                        "x-auth-token": token
                    }
                }).then(({ status, data }) => {
                    if (data.error) {
                        throw new Error(data.message)
                    }

                    if (status === 200 && data.response === "success") {
                        // debugger

                        // Copiamos el arreglo de las cryptos procesadas
                        const arr = dataTrading.crypto
                        arr.push(cryptoCurrency)

                        // creamos un objeto exacto al que esta en el estado
                        const data = {
                            crypto: arr,
                            day: moment().get('day')
                        }

                        // Modificamos con los nuevos datos
                        setDataTrading(data)

                        // lo agregamos al localstorare codificado
                        localStorage.setItem('@trading', jwt.encode(data, keySecret))


                        Swal.fire(
                            `Trading procesado`,
                            `
                            Todos los planes de inversion en 
                            ${cryptoCurrency === "1" ? 'BTC' : ''}
                            ${cryptoCurrency === "2" ? 'ETH' : ''}
                            fueron reportados
                            `,
                            "success"
                        )

                        setPercentage('')
                    }

                }).catch(reason => {
                    throw new Error(reason)
                })

            } else {
                Swal.fire(
                    `${cryptoCurrency === '1' ? 'Bitcoin' : ''} ${cryptoCurrency === '2' ? 'Ethereum' : ''}`,
                    "Esta moneda ya se proceso, elija una diferente",
                    "warning"
                )
            }


        } catch (error) {
            Swal.fire("Ha ocurrido un error", error, 'warning')
        } finally {
            setLoaderTrading(false)
        }


    }

    // Metodo que ejecuta el rechazo de un intercambio de moneda
    const declineExchangeRequest = async () => {
        try {
            if (reasonDecline.length < 10) {
                throw new Error("La razon de rechazo debe de tener minimo 10 caracteres")
            }

            setLoaderPetition(true)

            const previousData = {
                exchange: detailsRequestExchange,
                reason: reasonDecline,
            }

            await Petition.post("/exchange/decline", previousData, {
                headers: {
                    "x-auth-token": token
                }
            }).then(async ({ data }) => {
                if (data.error) {
                    throw data.message
                }

                if (data.response === "success") {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Solicitud Rechazada',
                        showConfirmButton: false,
                        timer: 1500
                    })

                    setReasonDecline("")

                    setExchangeRequestModal(false)

                    await getAllExchange()


                } else {
                    throw new Error("Tu rechazo no se ha podido procesar")
                }
            })

        } catch (error) {
            Swal.fire("Ha ocurrido un errro", error.toString(), "error")
        } finally {
            setLoaderPetition(false)

            setDeclineConfirm(false)
        }
    }

    // Metodo que ejecuta el rechazo de una solicitud de money changer
    const declineMoneyChangerRequest = async () => {
        try {
            setLoaderPetition(true)

            const data = {
                data: detailsRequestMoneyChanger,
                send: checkSendNotification,
                reason: reasonDecline,
            }

            await Petition.post("/money-changer/decline", data, { headers: { "x-auth-token": token } })
                .then(response => {
                    const { data } = response

                    if (data.error) {
                        // Verificamos si en la respuesta del servidor hay errores
                        throw data.message
                    } else if (data.response === "success") {
                        // Verificamos si se rechazo correctamente
                        setReasonDecline("")

                        setDeclineConfirm(false)

                        setMoneyChagerRequestModal(false)

                        Swal.fire({
                            position: 'top-end',
                            icon: 'success',
                            title: 'Solicitud Rechazada',
                            showConfirmButton: false,
                            timer: 1500
                        })

                        // Actualizamos la lista de solicitudes
                        getAllMoneyChanger()
                    } else {
                        // Si la respuesta del servidor es desconocida
                        throw new Error("No se ha podido ejecutar esta accion, contacte a Samuel.")
                    }
                })

        } catch (error) {
            Swal.fire("Ha ocurrido un errro", error.toString(), "error")
        } finally {
            setLoaderPetition(false)
        }
    }

    // Metodo que ejecuta el intercambio de moneda
    const acceptExhangeRequest = async () => {
        try {
            setLoaderPetition(true)

            if (hashExchangeRequest.length < 8) {
                throw new Error("El hash de transaccion no es valido")
            }

            const previousData = {
                exchange: detailsRequestExchange,
                hash: hashExchangeRequest,
            }

            await Petition.post("/exchange/accept", previousData, {
                headers: {
                    "x-auth-token": token
                }
            }).then(async ({ data }) => {
                if (data.error) {
                    throw new Error(data.message)
                }

                if (data.response === "success") {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Reporte enviado',
                        showConfirmButton: false,
                        timer: 1500
                    })

                    setExchangeRequestModal(false)

                    await getAllExchange()


                } else {
                    throw "El reporte no se ha podido procesar"
                }
            })

        } catch (error) {
            Swal.fire("AlyExchange", error.toString(), "error")
        }
    }

    useEffect(() => {
        setTittleDOM()

        // Verificamos si hay solicitudes de registro
        if (allRequest.length > 0) {
            setTittleDOM(`Solictudes (${allRequest.length})`)
        }

        // Verificamos si hay upgrades
        if (allUpgrades.length > 0) {
            setTittleDOM(`Upgrades (${allUpgrades.length})`)
        }

        // Verificamos si hay solicitudes de intercambios
        if (allExchange.length > 0) {
            setTittleDOM(`Exchange Request (${allExchange.length})`)
        }

        // Verificamos si hay solicitudes de Money Changer
        if (allMoneyChanger) {
            setTittleDOM(`Money Changer Request (${allMoneyChanger.length})`)
        }

    }, [allRequest, allUpgrades, allExchange, allMoneyChanger])

    useEffect(() => {
        ConfigurateComponent()

        configurateTrading()
    }, [])

    return (
        <div className="container-records">
            <NavigationBar />

            <div className="header-content">
                <div className="trading">
                    {
                        (percentage !== "" && (Number(percentage) > 1 || Number(percentage) < 0.5)) &&
                        <span className="message">
                            <b>Nota:</b> El porcentaje del trading es entre 0.5% a 1%
                        </span>
                    }

                    <input
                        value={percentage}
                        onChange={e => setPercentage(e.target.value)}
                        type="number"
                        placeholder="1%"
                        className="text-input" />

                    <select value={cryptoCurrency} onChange={e => setCrypto(e.target.value)} className="picker">
                        <option value="default" disabled>Selecciona una Moneda</option>

                        <optgroup label="Monedas disponibles">
                            <option value="1" disabled={dataTrading.crypto.includes('1')}>Bitcoin</option>
                            <option value="2" disabled={dataTrading.crypto.includes('2')}>Ethereum</option>
                        </optgroup>

                    </select>

                    <button className="button secondary" disabled={dataTrading.crypto.length === 2 || loaderTrading} onClick={applyTrading}>
                        {
                            loaderTrading
                                ? <>
                                    <ActivityIndicator size={16} /> <span>Cargando..</span>
                                </>
                                : <span>Aplicar Trading</span>
                        }
                    </button>
                </div>


            </div>

            <div className="content">
                <div className="collection">
                    <div className="menu-tab">
                        <div onClick={_ => setTab(1)} className={`item ${tab === 1 && "active"}`}>
                            Registros

                        {
                                allRequest.length > 0 &&
                                <span className="request">
                                    {allRequest.length}
                                </span>
                            }
                        </div>

                        <div onClick={_ => setTab(2)} className={`item ${tab === 2 && "active"}`}>
                            Upgrades

                        {
                                allUpgrades.length > 0 &&
                                <span className="request">
                                    {allUpgrades.length}
                                </span>
                            }
                        </div>

                        <div onClick={_ => setTab(3)} className={`item ${tab === 3 && "active"}`}>
                            Exchange

                            {
                                allExchange.length > 0 &&
                                <span className="request">
                                    {allExchange.length}
                                </span>
                            }
                        </div>

                        <div onClick={_ => setTab(4)} className={`item ${tab === 4 && "active"}`}>
                            Money Changer

                            {
                                allMoneyChanger.length > 0 &&
                                <span className="request">
                                    {allMoneyChanger.length}
                                </span>
                            }
                        </div>
                    </div>

                    {
                        loader &&
                        <ActivityIndicator size={64} />
                    }

                    {
                        tab === 1 &&
                        <>
                            {
                                (allRequest.length === 0 && !loader) &&
                                <>
                                    <div className="empty">
                                        <img src={Astronaut} alt="empty" />
                                        <h2 className="title">No hay Solicitudes</h2>
                                    </div>
                                </>
                            }

                            {
                                (allRequest.length > 0 && !loader) &&
                                <>
                                    <h2 className="title">Solicitudes de registros</h2>


                                    <div className="table request">
                                        <div className="header">
                                            <span>Nombre</span>
                                            <span>Monto</span>
                                            <span>Sponsor</span>
                                        </div>

                                        {
                                            allRequest.map(itemRequest)
                                        }
                                    </div>
                                </>
                            }
                        </>
                    }

                    {
                        tab === 2 &&
                        <>
                            {
                                (allUpgrades.length === 0 && !loader) &&
                                <>
                                    <div className="empty">
                                        <img src={Astronaut} alt="empty" />
                                        <h2 className="title">No hay Solicitudes</h2>
                                    </div>
                                </>
                            }

                            {
                                allUpgrades.length > 0 &&
                                <>
                                    <div className="separator" />

                                    <h2 className="title">Solicitudes de UPGRADES</h2>


                                    <div className="table request">
                                        <div className="header">
                                            <span>Nombre</span>
                                            <span>Monto</span>
                                            <span>Sponsor</span>
                                        </div>

                                        {
                                            allUpgrades.map(itemUpgrade)
                                        }
                                    </div>

                                </>
                            }
                        </>
                    }

                    {
                        tab === 3 &&
                        <>
                            {
                                (allExchange.length === 0 && !loader) &&
                                <>
                                    <div className="empty">
                                        <img src={Astronaut} alt="empty" />
                                        <h2 className="title">No hay Solicitudes</h2>
                                    </div>
                                </>
                            }

                            {
                                allExchange.length > 0 &&
                                <>
                                    <div className="separator" />

                                    <h2 className="title">Solicitudes de Exchange</h2>

                                    <div className="table exchange">
                                        <div className="header">
                                            <span>Compra</span>
                                            <span>Venta</span>
                                            <span>Cantidad</span>
                                            <span>Solicitado</span>
                                        </div>

                                        {
                                            allExchange.map(itemExchnage)
                                        }
                                    </div>

                                </>
                            }

                        </>
                    }

                    {
                        tab === 4 &&
                        <>
                            {
                                (allMoneyChanger.length === 0 && !loader) &&
                                <>
                                    <div className="empty">
                                        <img src={Astronaut} alt="empty" />
                                        <h2 className="title">No hay Solicitudes</h2>
                                    </div>
                                </>
                            }

                            {
                                allMoneyChanger.length > 0 &&
                                <>
                                    <div className="separator" />

                                    <h2 className="title">Solicitudes de Exchange</h2>

                                    <div className="table exchange">
                                        <div className="header">
                                            <span>Tipo</span>
                                            <span>Moneda</span>
                                            <span>Monto</span>
                                            <span>Solicitado</span>
                                        </div>

                                        {
                                            allMoneyChanger.map(itemMoneyChanger)
                                        }
                                    </div>

                                </>
                            }

                        </>
                    }

                </div>

                <div className="collection">
                    {
                        loader &&
                        <ActivityIndicator size={64} />
                    }

                    {
                        (allRecord.length === 0 && !loader) &&
                        <>
                            <div className="empty">
                                <img src={Astronaut} alt="empty" />
                                <h2 className="title">No hay Registos</h2>
                            </div>
                        </>
                    }

                    {
                        allRecord.length > 0 &&
                        <>
                            <div className="sub-header">
                                <h2 className="title">Registros</h2>

                                <input
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    placeholder="Escribe para buscar.."
                                    type="text"
                                    className="text-input" />
                            </div>

                            <div className="table records">
                                <div className="header">
                                    <span>Fecha</span>
                                    <span>Nombre</span>
                                    <span>Pais</span>
                                    <span>Sponsor</span>
                                </div>

                                {
                                    allRecord.map(itemRecord)
                                }
                            </div>
                        </>
                    }
                </div>
            </div>

            {
                showRecord &&
                <Modal onClose={e => setShowRecord(false)}>
                    <div className="content-modal request">

                        {
                            loaderPetition &&
                            <ActivityIndicator size={48} />
                        }

                        {
                            !loaderPetition &&
                            <>
                                <div className="content-col">
                                    <div className="col">
                                        <h2>Detalles</h2>
                                        <div className="row">
                                            <span className="name">Nombre</span>
                                            <span className="value">{dataRecord.name}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Correo</span>
                                            <span className="value">{dataRecord.email}</span>
                                        </div>


                                        <div className="row">
                                            <span className="name">Pais</span>
                                            <span className="value">{dataRecord.country}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Telefono</span>
                                            <span className="value">{dataRecord.phone}</span>
                                        </div>

                                        <div className="row color">
                                            <span className="name">Sponsor</span>
                                            {
                                                dataRecord.email_sponsor !== null &&
                                                < span className="value">{dataRecord.email_sponsor}</span>
                                            }

                                            {
                                                dataRecord.email_sponsor === null &&
                                                < span className="value">
                                                    <i>SIN SPONSOR</i>
                                                </span>
                                            }
                                        </div>

                                        {/* {
                                            dataRecord.email_sponsor !== null &&
                                            <div className="row">
                                                <span className="name">Comision</span>
                                                <span className="value">{dataRecord.phone}</span>
                                            </div>
                                        } */}

                                    </div>

                                    <div className="col">
                                        <div className="rows border-bottom">
                                            <div className="header">
                                                <span className={`status ${dataRecord.amount_btc !== null ? 'active' : 'inactive'}`}>
                                                    {dataRecord.amount_btc !== null ? 'Activo' : 'Inactivo'}
                                                </span>
                                                <h2>Plan en Bitcoin</h2>
                                            </div>

                                            <div className="row">
                                                <span className="name">Monto Actual</span>
                                                {
                                                    dataRecord.amount_btc !== null
                                                        ? <span className="value">{dataRecord.amount_btc} BTC</span>
                                                        : <span className="value"> <i>SIN MONTO</i> </span>
                                                }
                                            </div>

                                            <div className="row">
                                                <span className="name">Wallet</span>
                                                <span className="value copy" onClick={_ => copyData(dataRecord.wallet_btc)}>{dataRecord.wallet_btc}</span>
                                            </div>
                                        </div>

                                        <div className="rows border-bottom">
                                            <div className="header">
                                                <span className={`status ${dataRecord.amount_eth !== null ? 'active' : 'inactive'}`}>
                                                    {dataRecord.amount_eth !== null ? 'Activo' : 'Inactivo'}
                                                </span>
                                                <h2>Plan en Ethereum</h2>
                                            </div>

                                            <div className="row">
                                                <span className="name">Monto Actual</span>
                                                {
                                                    dataRecord.amount_eth !== null
                                                        ? <span className="value">{dataRecord.amount_eth} ETH</span>
                                                        : <span className="value"> <i>SIN MONTO</i> </span>
                                                }
                                            </div>

                                            <div className="row">
                                                <span className="name">Wallet</span>
                                                <span className="value copy" onClick={_ => copyData(dataRecord.wallet_eth)}>{dataRecord.wallet_eth}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="buttons">
                                    <button className="button large" onClick={e => setShowRecord(false)}>
                                        cerrar
                                    </button>

                                    <button className="button large secondary">
                                        Generar Reporte
                                    </button>
                                </div>
                            </>
                        }
                    </div>
                </Modal>
            }

            {
                showRequest &&
                <Modal onClose={_ => setShowRequest(false)}>
                    <div className="content-modal request">
                        {
                            loaderPetition &&
                            <ActivityIndicator size={48} />
                        }
                        {
                            !loaderPetition &&
                            <>
                                <div className="content-col">
                                    <div className="col">
                                        <h2>Detalles de solicitud</h2>

                                        <div className="row">
                                            <span className="name">Nombre</span>
                                            <span className="value">{dataRequest.name}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Correo</span>
                                            <span className="value">{dataRequest.email}</span>
                                        </div>

                                        <div className="row">
                                            {
                                                dataRequest.email_airtm !== null
                                                    ? <span className="name">Id de manipulacion</span>
                                                    : <span className="name">Hash de transaccion</span>
                                            }

                                            <span className="value copy" onClick={_ => copyData(dataRequest.hash)}>{dataRequest.hash}</span>
                                        </div>

                                        {
                                            (dataRequest.aproximate_amount !== null) &&

                                            <>
                                                <div className="row">
                                                    <span className="name">Deposito aproximado</span>
                                                    <span className="value">$ {dataRequest.aproximate_amount}</span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">Correo de transaccion</span>
                                                    <span className="value">{dataRequest.email_airtm}</span>
                                                </div>
                                            </>
                                        }

                                        <div className="row">
                                            <span className="name">Monto</span>
                                            <span className="value">
                                                {dataRequest.amount} {dataRequest.id_currency === 1 && 'BTC'} {dataRequest.id_currency === 2 && 'ETH'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`col${dataRequest.sponsor_username === null ? ' empty' : ''}`}>
                                        {
                                            dataRequest.sponsor_username === null &&
                                            <>
                                                <h2>
                                                    Sin Sponsor
                                            </h2>
                                            </>
                                        }

                                        {
                                            dataRequest.sponsor_username !== null &&
                                            <>
                                                <h2>Sponsor</h2>

                                                <div className="row">
                                                    <span className="name">Nombre</span>
                                                    <span className="value">{dataRequest.sponsor_name}</span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">Correo Electronico</span>
                                                    <span className="value">{dataRequest.sponsor_email}</span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">Comision</span>
                                                    <span className="value">{dataRequest.amount * 0.05}</span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">
                                                        Wallet en {dataRequest.id_currency === 1 && 'BTC'} {dataRequest.id_currency === 2 && 'ETH'}
                                                    </span>

                                                    <span className="value copy" onClick={_ => {
                                                        copyData(dataRequest.id_currency === 1 ? dataRequest.sponsor_wallet_btc : dataRequest.sponsor_wallet_eth)
                                                    }}>
                                                        {dataRequest.id_currency === 1 && dataRequest.sponsor_wallet_btc}
                                                        {dataRequest.id_currency === 2 && dataRequest.sponsor_wallet_eth}
                                                    </span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">Hash de transaccion</span>
                                                    <input
                                                        type="text"
                                                        value={hashForSponsor}
                                                        onChange={e => setHashForSponsor(e.target.value)}
                                                        placeholder="Transaccion a sponsor"
                                                        className="text-input" />
                                                </div>
                                            </>
                                        }
                                    </div>
                                </div>


                                <div className="buttons">
                                    <button className="button large" onClick={_ => confirmDecline(dataRequest.id)}>
                                        Rechazar
                                </button>

                                    <button className="button large secondary" onClick={_ => AcceptRequest(dataRequest)}>
                                        Aprobar
                                </button>
                                </div>
                            </>
                        }

                    </div>
                </Modal>
            }

            {
                showUpgrade &&
                <Modal onClose={_ => setShowUpgrade(false)}>
                    <div className="content-modal request">
                        {
                            loaderPetition &&
                            <ActivityIndicator size={48} />
                        }
                        {
                            !loaderPetition &&
                            <>
                                <div className="content-col">
                                    <div className="col">
                                        <h2>Detalles de solicitud</h2>

                                        <div className="row">
                                            <span className="name">Nombre</span>
                                            <span className="value">{dataUpgrade.name}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Correo</span>
                                            <span className="value">{dataUpgrade.email}</span>
                                        </div>

                                        <div className="row">
                                            {
                                                dataUpgrade.email_airtm !== null
                                                    ? <span className="name">Id de manipulacion</span>
                                                    : <span className="name">Hash de transaccion</span>
                                            }

                                            <span className="value copy" onClick={_ => copyData(dataUpgrade.hash)}>{dataUpgrade.hash}</span>
                                        </div>

                                        {
                                            (dataUpgrade.aproximate_amount !== null) &&

                                            <>
                                                <div className="row">
                                                    <span className="name">Deposito aproximado</span>
                                                    <span className="value">$ {dataUpgrade.aproximate_amount}</span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">Correo de transaccion</span>
                                                    <span className="value">{dataUpgrade.email_airtm}</span>
                                                </div>
                                            </>
                                        }

                                        <div className="row">
                                            <span className="name">Monto Actual</span>
                                            <span className="value">
                                                {dataUpgrade.current_amount} {dataUpgrade.id_currency === 1 && 'BTC'} {dataUpgrade.id_currency === 2 && 'ETH'}
                                            </span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Monto a Sumar</span>
                                            <span className="value">
                                                {dataUpgrade.amount_requested} {dataUpgrade.id_currency === 1 && 'BTC'} {dataUpgrade.id_currency === 2 && 'ETH'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`col${dataUpgrade.id_sponsor === null ? ' empty' : ''}`}>
                                        {
                                            dataUpgrade.id_sponsor === null &&
                                            <>
                                                <h2>
                                                    Sin Sponsor
                                            </h2>
                                            </>
                                        }

                                        {
                                            dataUpgrade.id_sponsor !== null &&
                                            <>
                                                <h2>Sponsor</h2>

                                                <div className="row">
                                                    <span className="name">Nombre</span>
                                                    <span className="value">{dataUpgrade.sponsor_name}</span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">Correo Electronico</span>
                                                    <span className="value">{dataUpgrade.sponsor_email}</span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">Comision por Upgrade</span>
                                                    <span className="value">{dataUpgrade.amount_requested * 0.05}</span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">
                                                        Wallet en {dataUpgrade.id_currency === 1 && 'BTC'} {dataUpgrade.id_currency === 2 && 'ETH'}
                                                    </span>

                                                    <span className="value copy" onClick={_ => {
                                                        copyData(dataUpgrade.id_currency === 1 ? dataUpgrade.sponsor_wallet_btc : dataUpgrade.sponsor_wallet_eth)
                                                    }}>
                                                        {dataUpgrade.id_currency === 1 && dataUpgrade.sponsor_wallet_btc}
                                                        {dataUpgrade.id_currency === 2 && dataUpgrade.sponsor_wallet_eth}
                                                    </span>
                                                </div>

                                                <div className="row">
                                                    <span className="name">Hash de transaccion</span>
                                                    <input
                                                        type="text"
                                                        value={hashForSponsor}
                                                        onChange={e => setHashForSponsor(e.target.value)}
                                                        placeholder="Transaccion a sponsor"
                                                        className="text-input" />
                                                </div>
                                            </>
                                        }
                                    </div>
                                </div>


                                <div className="buttons">
                                    <button className="button large" onClick={_ => confirmDeclineUpgrade(dataUpgrade.id)}>
                                        Rechazar
                                    </button>

                                    <button className="button large secondary" onClick={_ => AcceptUpgrade(dataUpgrade)}>
                                        Aprobar
                                </button>
                                </div>
                            </>
                        }

                    </div>
                </Modal>
            }

            {
                showExchangeRequest &&
                <Modal onClose={e => setExchangeRequestModal(false)}>
                    <div className="content-modal exchange">

                        {
                            loaderPetition &&
                            <ActivityIndicator size={48} />
                        }

                        {
                            (!loaderPetition && !declineConfirm) &&
                            <>
                                <div className="content-col">
                                    <div className="col">
                                        <h2>Detalle de Compra</h2>

                                        <div className="row">
                                            <span className="name">Solicitud Procesada</span>
                                            <span className="value">{moment(detailsRequestExchange.date).fromNow()}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Moneda a pagar</span>
                                            <span className="value">{detailsRequestExchange.currency}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Moneda a comprar</span>
                                            <span className="value">{detailsRequestExchange.request_currency}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Cliente</span>
                                            <span className="value">{detailsRequestExchange.email}</span>
                                        </div>
                                    </div>

                                    <div className="col">
                                        <h2>Detalle de Transaccion</h2>

                                        <div className="row">
                                            <span className="name">Hash de transaccion</span>
                                            <span className="value">{detailsRequestExchange.hash}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Monto recibido</span>
                                            <span className="value">{detailsRequestExchange.amount} {detailsRequestExchange.currency}</span>
                                        </div>


                                        <div className="row">
                                            <span className="name">Monto aproximado de {detailsRequestExchange.request_currency}</span>
                                            <span className="value">{detailsRequestExchange.approximate_amount} <b>{detailsRequestExchange.request_currency}</b></span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Direccion Wallet</span>
                                            <span className="value copy" onClick={_ => copyData(detailsRequestExchange.wallet)}>{detailsRequestExchange.wallet}</span>
                                        </div>

                                        {
                                            detailsRequestExchange.memo !== null &&
                                            <div className="row">
                                                <span className="name">Memo</span>
                                                <span className="value">{detailsRequestExchange.memo}</span>
                                            </div>
                                        }

                                        {
                                            detailsRequestExchange.label !== null &&
                                            <div className="row">
                                                <span className="name">Label</span>
                                                <span className="value">{detailsRequestExchange.label}</span>
                                            </div>
                                        }

                                        <div className="row">
                                            <span className="name">Hash de Pago</span>
                                            <input
                                                type="text"
                                                value={hashExchangeRequest}
                                                onChange={e => setHashExchangeRequest(e.target.value)}
                                                placeholder="Hash de Transaccion"
                                                className="text-input" />
                                        </div>
                                    </div>

                                </div>


                                <div className="buttons">
                                    <button className="button large" onClick={_ => setDeclineConfirm(true)}>
                                        Rechazar
                                    </button>

                                    <button className="button large secondary" onClick={acceptExhangeRequest}>
                                        Responder
                                    </button>
                                </div>
                            </>
                        }

                        {
                            (declineConfirm && !loaderPetition) &&
                            <div className="confirm-decline">
                                <h1>Rechazar Solicitud de intercambio</h1>

                                <div className="row-reason">
                                    <span className="legend-decline">
                                        Describa la razon de rechazo ({reasonDecline.length})
                                    </span>

                                    <textarea
                                        className="text-input"
                                        placeholder="Razon de rechazo"
                                        value={reasonDecline}
                                        rows="5"
                                        onChange={e => setReasonDecline(e.target.value)} />
                                </div>

                                <div className="buttons">
                                    <button className="button large" onClick={e => setDeclineConfirm(false)}>
                                        Cancelar
                                    </button>

                                    <button onClick={declineExchangeRequest} className="button large secondary">
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        }
                    </div>
                </Modal>
            }

            {
                showMoneyChagerRequest &&
                <Modal onClose={e => setMoneyChagerRequestModal(false)}>
                    <div className="content-modal exchange">
                        {
                            loaderPetition &&
                            <ActivityIndicator size={48} />
                        }

                        {
                            (!loaderPetition && detailsRequestMoneyChanger !== null && !declineConfirm) &&
                            <>
                                <div className="content-col">
                                    <div className="col">
                                        {
                                            detailsRequestMoneyChanger.type === "buy" &&
                                            <h2>Detalles de Compra</h2>
                                        }

                                        {
                                            detailsRequestMoneyChanger.type === "sell" &&
                                            <h2>Detalles de Venta</h2>
                                        }

                                        {
                                            (detailsRequestMoneyChanger.type !== "sell" && detailsRequestMoneyChanger.type !== "buy") &&
                                            <h2>Detalles general</h2>
                                        }

                                        <div className="row">
                                            <span className="name">Solicitud Procesada</span>
                                            <span className="value">{moment(detailsRequestMoneyChanger.date).fromNow()}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Moneda</span>
                                            <span className="value">{detailsRequestMoneyChanger.coin_name}</span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Precio moneda</span>
                                            <span className="value copy" onClick={_ => copyData(detailsRequestMoneyChanger.price_coin)}>
                                                $ {detailsRequestMoneyChanger.price_coin}
                                            </span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Correo Airtm</span>
                                            <span className="value copy" onClick={_ => copyData(detailsRequestMoneyChanger.email_airtm)}>{detailsRequestMoneyChanger.email_airtm}</span>
                                        </div>
                                    </div>

                                    <div className="col">
                                        <h2>Detalle de Transaccion</h2>

                                        {
                                            detailsRequestMoneyChanger.manipulation_id !== null &&
                                            <div className="row">
                                                <span className="name">ID de manipulacion</span>
                                                <span className="value copy" onClick={_ => copyData(detailsRequestMoneyChanger.manipulation_id)}>{detailsRequestMoneyChanger.manipulation_id}</span>
                                            </div>
                                        }

                                        {
                                            detailsRequestMoneyChanger.wallet !== null &&
                                            <div className="row">
                                                <span className="name">Wallet</span>
                                                <span className="value copy" onClick={_ => copyData(detailsRequestMoneyChanger.wallet)}>{detailsRequestMoneyChanger.wallet}</span>
                                            </div>
                                        }


                                        <div className="row">
                                            {
                                                detailsRequestMoneyChanger.type === "buy" &&
                                                <span className="name">Monto (USD) <b>A RECIBIR</b></span>
                                            }

                                            {
                                                detailsRequestMoneyChanger.type === "sell" &&
                                                <span className="name">Monto (USD) <b>A ENVIAR</b></span>
                                            }

                                            {
                                                (detailsRequestMoneyChanger.type !== "sell" && detailsRequestMoneyChanger.type !== "buy") &&
                                                <span className="name">Monto (USD)</span>
                                            }
                                            <span className="value copy" onClick={_ => copyData(detailsRequestMoneyChanger.amount_usd)}>
                                                $ {WithDecimals(detailsRequestMoneyChanger.amount_usd)}
                                            </span>
                                        </div>

                                        <div className="row">
                                            <span className="name">Fracciones</span>
                                            <span className="value copy" onClick={_ => copyData(detailsRequestMoneyChanger.amount_fraction)}>{detailsRequestMoneyChanger.amount_fraction}</span>
                                        </div>

                                        {
                                            detailsRequestMoneyChanger.hash === null &&
                                            <div className="row">
                                                <span className="name">Hash de Pago</span>

                                                <input
                                                    type="text"
                                                    value={hashMonyeChangerRequest}
                                                    onChange={e => setHashMonyeChangerRequest(e.target.value)}
                                                    placeholder="Hash de Transaccion"
                                                    className="text-input" />
                                            </div>
                                        }

                                        {
                                            detailsRequestMoneyChanger.hash !== null &&
                                            <div className="row">
                                                <span className="name">Hash de transaccion</span>
                                                <span className="value copy" onClick={_ => copyData(detailsRequestMoneyChanger.hash)}>{detailsRequestMoneyChanger.hash}</span>
                                            </div>
                                        }

                                        {
                                            detailsRequestMoneyChanger.manipulation_id === null &&
                                            <div className="row">
                                                <span className="name">ID de manipulacion</span>

                                                <input
                                                    type="text"
                                                    value={hashMonyeChangerRequest}
                                                    onChange={e => setHashMonyeChangerRequest(e.target.value)}
                                                    placeholder="ID de manipulacion"
                                                    className="text-input" />
                                            </div>
                                        }
                                    </div>
                                </div>

                                <div className="buttons">
                                    <button className="button large" onClick={_ => setDeclineConfirm(true)}>
                                        Rechazar
                                    </button>

                                    <button className="button large secondary" onClick={acceptMoneyChanger}>
                                        Aceptar
                                    </button>
                                </div>
                            </>
                        }

                        {
                            (declineConfirm && !loaderPetition) &&
                            <div className="confirm-decline">
                                <h1>Rechazar Solicitud de intercambio</h1>

                                <div className="row-reason">
                                    <div className="sub-row">
                                        <span className="legend-decline">
                                            Describa la razon de rechazo ({reasonDecline.length})
                                        </span>

                                        <div className="content-check">
                                            <label htmlFor="check-send-email-decline">Enviar notificación</label>
                                            <input
                                                checked={checkSendNotification}
                                                onChange={_ => setCheckSendNotification(!checkSendNotification)}
                                                type="checkbox"
                                                id="check-send-email-decline" />
                                        </div>
                                    </div>

                                    <textarea
                                        className="text-input"
                                        placeholder="Razon de rechazo"
                                        value={reasonDecline}
                                        rows="5"
                                        onChange={e => setReasonDecline(e.target.value)} />
                                </div>

                                <div className="buttons">
                                    <button className="button large" onClick={e => setDeclineConfirm(false)}>
                                        Cancelar
                                    </button>

                                    <button onClick={declineMoneyChangerRequest} className="button large secondary">
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        }
                    </div>
                </Modal>
            }

        </div >
    )
}

export default Records